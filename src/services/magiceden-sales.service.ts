import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { ethers } from 'ethers';
import { NFTMetadataService } from './nft-metadata.service';
import { SaleData } from '../types/sale.types';

@Injectable()
export class MagicEdenSalesService extends BaseService {
  private provider: ethers.providers.JsonRpcProvider;
  private ME_ADDRESSES: string[];
  private processedSales = new Set<string>();
  private metadataService: NFTMetadataService;

  constructor(metadataService: NFTMetadataService) {
    super();
    this.ME_ADDRESSES = this.config.marketplaces.magiceden.addresses;
    console.log('Initialized Magic Eden sales monitor');
    
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || 'https://apechain.drpc.org'
    );
    this.metadataService = metadataService;
  }

  async initialize() {
    const nftContract = new ethers.Contract(
      this.config.contract_address,
      ["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"],
      this.provider
    );

    nftContract.on("Transfer", async (from, to, tokenId, event) => {
      if (this.config.debug_mode) {
        console.log(`Transfer event detected:
          - From: ${from}
          - To: ${to}
          - Token ID: ${tokenId}
          - TX Hash: ${event.transactionHash}
        `);
      }
      
      const tx = await event.getTransaction();
      
      // Consider it a sale if:
      // 1. It's going to any ME marketplace contract AND
      // 2. Either has non-zero value OR is the bid acceptance contract
      const isMESale = 
        this.ME_ADDRESSES.some(addr => 
          tx.to?.toLowerCase() === addr.toLowerCase()
        ) && 
        (
          !tx.value.isZero() || 
          tx.to?.toLowerCase() === '0x224ecB4Eae96d31372D1090c3B0233C8310dBbaB'.toLowerCase()
        );

      if (this.config.debug_mode) {
        console.log(`Sale detection for ${event.transactionHash}:
          - Is ME Address: ${this.ME_ADDRESSES.some(addr => tx.to?.toLowerCase() === addr.toLowerCase())}
          - Has Value: ${!tx.value.isZero()}
          - Is Bid Accept: ${tx.to?.toLowerCase() === '0x224ecB4Eae96d31372D1090c3B0233C8310dBbaB'.toLowerCase()}
          - Final isMESale: ${isMESale}
        `);
      }

      if (isMESale) {
        try {
          const receipt = await this.getTransactionReceipt(event.transactionHash);
          
          // Get unique token IDs from transfers
          const uniqueTokenIds = new Set(
            receipt.logs
              .filter(log => log.address.toLowerCase() === this.config.contract_address.toLowerCase())
              .filter(log => {
                const topics = log.topics;
                return topics[0] === nftContract.interface.getEventTopic('Transfer');
              })
              .map(log => ethers.BigNumber.from(log.topics[3]).toString())
          );

          const transferCount = uniqueTokenIds.size;

          if (this.config.debug_mode) {
            console.log(`Transfer details for ${event.transactionHash}:
              - Total transfers: ${transferCount}
              - Token IDs: ${Array.from(uniqueTokenIds).join(', ')}
            `);
          }

          // Get price - check for both APE and WAPE
          let price = tx.value;  // Direct APE value
          if (price.isZero() && tx.to?.toLowerCase() === '0x224ecB4Eae96d31372D1090c3B0233C8310dBbaB'.toLowerCase()) {
            // This is a bid acceptance (WAPE), look for ERC20 Transfer event
            const wapeTransfers = receipt.logs.filter(log => {
              // Look for WAPE transfer events
              try {
                const topics = log.topics;
                const isTransfer = topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
                const hasValue = log.data && log.data !== '0x';
                const isERC20Transfer = topics.length === 3;
                
                if (this.config.debug_mode) {
                  console.log(`WAPE transfer check for log:
                    - Is Transfer: ${isTransfer}
                    - Has Value: ${hasValue}
                    - Is ERC20: ${isERC20Transfer}
                    - Data: ${log.data}
                  `);
                }
                
                return isTransfer && isERC20Transfer && hasValue;
              } catch (e) {
                console.error('Error checking WAPE transfer:', e);
                return false;
              }
            });

            if (wapeTransfers.length > 0) {
              // Sort by value to get the highest value transfer (the actual sale amount)
              const sortedTransfers = wapeTransfers.sort((a, b) => {
                const valueA = ethers.BigNumber.from(a.data);
                const valueB = ethers.BigNumber.from(b.data);
                return valueB.gt(valueA) ? 1 : -1;
              });

              price = ethers.BigNumber.from(sortedTransfers[0].data);
              
              if (this.config.debug_mode) {
                console.log(`WAPE price calculation for ${event.transactionHash}:
                  - Total transfers found: ${wapeTransfers.length}
                  - Selected price (wei): ${price.toString()}
                  - All transfer values: ${wapeTransfers.map(log => ethers.BigNumber.from(log.data).toString()).join(', ')}
                `);
              }
            }
          }

          // Only proceed if we have a valid price
          if (!price.isZero()) {
            const totalPrice = ethers.utils.formatEther(price);
            const isWapeSale = tx.to?.toLowerCase() === '0x224ecB4Eae96d31372D1090c3B0233C8310dBbaB'.toLowerCase();
            
            // For WAPE sales, each NFT is sold for the full price
            // For regular sales, the total price is split between NFTs
            const adjustedTotalPrice = isWapeSale ? 
              (parseFloat(totalPrice) * transferCount).toString() : 
              totalPrice;
            
            const pricePerNFT = isWapeSale ? 
              totalPrice : 
              (parseFloat(totalPrice) / transferCount).toString();

            if (this.config.debug_mode) {
              console.log(`Price calculations for ${event.transactionHash}:
                - Raw price (wei): ${price.toString()}
                - Total price (APE): ${totalPrice}
                - Is WAPE sale: ${isWapeSale}
                - Transfer count: ${transferCount}
                - Adjusted total: ${adjustedTotalPrice}
                - Price per NFT: ${pricePerNFT}
              `);
            }

            const tokenId = Array.from(uniqueTokenIds)[0];
            if (!tokenId) {
              console.error('No token ID found in transfer');
              return;
            }

            const saleData = {
              tokenId: tokenId.toString(),
              price: pricePerNFT,
              totalPrice: adjustedTotalPrice,
              transferCount,
              seller: from,
              buyer: to,
              transactionHash: event.transactionHash
            };

            await this.processSale(saleData);
          } else if (this.config.debug_mode) {
            console.log(`Skipping sale ${event.transactionHash} - zero price detected`);
          }
        } catch (error) {
          console.error('Error processing sale:', error);
          // Remove from processed sales if there was an error
          this.processedSales.delete(event.transactionHash);
        }
      }
    });

    console.log('Listening for sales...');
  }

  private async processSale(saleData: Partial<SaleData>) {
    try {
      const displayTokenId = (parseInt(saleData.tokenId) + this.config.token_id_offset).toString();
      
      // Generate URLs
      const itemUrl = this.config.marketplaces.magiceden.item_url
        .replace('{contract}', this.config.contract_address)
        .replace('{tokenId}', saleData.tokenId);
      
      const txUrl = this.config.explorer.tx_url
        .replace('{txHash}', saleData.transactionHash);

      // Get image URLs and traits for the NFTs
      const [imageUrls, nftTraits] = await Promise.all([
        this.getNFTImages(saleData),
        this.getNFTTraits(saleData)
      ]);
      
      // Determine if this is a WAPE sale
      const isWapeSale = saleData.transactionHash && 
        await this.isWapeSale(saleData.transactionHash);
      
      const createMessage = (templates: any) => {
        const baseMessage = saleData.transferCount > 1 
          ? (isWapeSale ? templates.bulkWapeSaleMessage : templates.bulkSaleMessage)
              .replace('{count}', saleData.transferCount)
              .replace('{totalPrice}', saleData.totalPrice)
              .replace('{avgPrice}', saleData.price)
              .replace('{marketplace}', 'Magic Eden')
              .replace('{txUrl}', txUrl)
          : (isWapeSale ? templates.wapeSaleMessage : templates.saleMessage)
              .replace('{tokenId}', displayTokenId)
              .replace('{price}', saleData.price)
              .replace('{marketplace}', 'Magic Eden')
              .replace('{itemUrl}', itemUrl);

        // Replace trait placeholders if available
        if (nftTraits?.formattedTraits) {
            // For Twitter, replace {traits} directly
            return baseMessage.replace('{traits}', nftTraits.formattedTraits.twitter);
        }

        return baseMessage;
      };

      const twitterMessage = createMessage(this.config.twitter);

      if (this.config.debug_mode) {
        console.log('Processing sale:', {
          tokenId: saleData.tokenId,
          price: saleData.price,
          marketplace: saleData.marketplace,
          txHash: saleData.transactionHash,
          isBulkSale: saleData.transferCount > 1,
          isWapeSale,
          traits: nftTraits?.traits
        });
      }

      // Generate a unique key for this sale
      const saleKey = saleData.transferCount > 1 ? saleData.transactionHash : `${saleData.tokenId}-${saleData.transactionHash}`;

      // Check if we've already processed this sale
      if (this.processedSales.has(saleKey)) {
        if (this.config.debug_mode) {
          console.log(`Sale already processed: ${saleKey}`);
        }
        return;
      }

      // Add to processed sales
      this.processedSales.add(saleKey);
      
      // Emit the sale event
      this.emit('sale', {
        tokenId: saleData.tokenId,
        displayTokenId,
        price: saleData.price,
        totalPrice: saleData.totalPrice,
        count: saleData.transferCount,
        marketplace: 'Magic Eden',
        buyer: saleData.buyer,
        seller: saleData.seller,
        transactionHash: saleData.transactionHash,
        isBulkSale: saleData.transferCount > 1,
        isWapeSale,
        itemUrl,
        txUrl,
        imageUrls,
        twitterMessage,
        transferCount: saleData.transferCount,
        traits: nftTraits?.traits,
        formattedTraits: nftTraits?.formattedTraits
      } as SaleData);

      if (this.config.debug_mode) {
        console.log(`Sale processed: ${twitterMessage}`);
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      // Remove from processed sales if there was an error
      if (saleData.transactionHash) {
        this.processedSales.delete(saleData.transactionHash);
      }
    }
  }

  private async isWapeSale(txHash: string): Promise<boolean> {
    const receipt = await this.getTransactionReceipt(txHash);
    return receipt.to?.toLowerCase() === '0x224ecB4Eae96d31372D1090c3B0233C8310dBbaB'.toLowerCase();
  }

  private async getTransactionReceipt(txHash: string, retries = 3): Promise<any> {
    try {
      const tx = await this.provider.getTransactionReceipt(txHash);
      return tx;
    } catch (error) {
      if (retries > 0 && error.code === 'SERVER_ERROR') {
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
        return this.getTransactionReceipt(txHash, retries - 1);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; lastBlock?: number; providerConnected: boolean }> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      return {
        status: 'healthy',
        lastBlock: blockNumber,
        providerConnected: network.chainId === 40875, // Apechain
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        providerConnected: false
      };
    }
  }

  private async getNFTImages(saleData: any): Promise<string[]> {
    try {
      if (saleData.transferCount > 1) {
        // Get all token IDs from transfer events (useful for future database logging)
        const receipt = await this.getTransactionReceipt(saleData.transactionHash);
        const allTokenIds = Array.from(new Set<string>(
          receipt.logs
            .filter(log => log.address.toLowerCase() === this.config.contract_address.toLowerCase())
            .map(log => ethers.BigNumber.from(log.topics[3]).toString())
        ));

        // Only fetch images for the first 4 tokens in bulk sales
        const tokensForImages = allTokenIds.slice(0, 4);
        
        if (this.config.debug_mode) {
          console.log(`Bulk sale detected: ${allTokenIds.length} total tokens, fetching images for first ${tokensForImages.length}`);
        }

        return await Promise.all(
          tokensForImages.map(id => this.metadataService.getImageUrl(this.config.contract_address, id))
        );
      } else {
        const imageUrl = await this.metadataService.getImageUrl(
          this.config.contract_address, 
          saleData.tokenId
        );
        return imageUrl ? [imageUrl] : [];
      }
    } catch (error) {
      console.error('Error getting NFT images:', error);
      return [];
    }
  }

  private async getNFTTraits(saleData: any) {
    try {
      // Only fetch traits for single sales, not bulk sales
      if (!saleData.transferCount || saleData.transferCount === 1) {
        return await this.metadataService.getTraits(
          this.config.contract_address,
          saleData.tokenId
        );
      }
      return null;
    } catch (error) {
      console.error('Error getting NFT traits:', error);
      return null;
    }
  }
} 