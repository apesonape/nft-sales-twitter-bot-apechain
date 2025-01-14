import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { BaseService } from './base.service';

@Injectable()
export class NFTImageService extends BaseService {
  private provider: ethers.providers.JsonRpcProvider;
  private cache = new Map<string, string>(); // Cache image URLs

  private readonly IPFS_GATEWAYS = [
    'https://nftstorage.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/'
  ];

  constructor() {
    super();
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || 'https://apechain.drpc.org'
    );
  }

  private async resolveIPFSUrl(ipfsUrl: string): Promise<string> {
    const hash = ipfsUrl.replace('ipfs://', '').replace('/ipfs/', '');
    
    // Try each gateway in sequence
    for (const gateway of this.IPFS_GATEWAYS) {
      try {
        const url = `${gateway}${hash}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Successfully resolved IPFS URL using gateway: ${gateway}`);
          return url;
        }
      } catch (e) {
        console.log(`Gateway ${gateway} failed, trying next...`);
        continue;
      }
    }
    
    // If all gateways fail, use the first one
    console.log(`All gateways failed, falling back to first gateway`);
    return `${this.IPFS_GATEWAYS[0]}${hash}`;
  }

  async getImageUrl(contractAddress: string, tokenId: string): Promise<string> {
    const cacheKey = `${contractAddress}-${tokenId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Standard NFT interface for metadata
      const nftContract = new ethers.Contract(
        contractAddress,
        [
          "function tokenURI(uint256) view returns (string)",
          "function uri(uint256) view returns (string)" // Some contracts use this instead
        ],
        this.provider
      );

      // Try tokenURI first, fall back to uri()
      let metadataUrl;
      try {
        metadataUrl = await nftContract.tokenURI(tokenId);
      } catch {
        metadataUrl = await nftContract.uri(tokenId);
      }

      // Handle IPFS URLs
      if (metadataUrl.startsWith('ipfs://')) {
        metadataUrl = metadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      // Fetch metadata
      const response = await fetch(metadataUrl);
      const metadata = await response.json();
      
      // Get image URL from metadata
      let imageUrl = metadata.image;
      
      // Handle IPFS image URLs
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = await this.resolveIPFSUrl(imageUrl);
      }

      // Cache the result
      this.cache.set(cacheKey, imageUrl);
      
      return imageUrl;
    } catch (error) {
      console.error('Error fetching NFT image:', error);
      return null;
    }
  }
} 