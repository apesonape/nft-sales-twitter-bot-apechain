import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { BaseService } from './base.service';

export interface NFTMetadata {
  image: string;
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface NFTTraits {
  traits: {
    trait_type: string;
    value: string | number;
  }[];
  formattedTraits: {
    discord: string;
    twitter: string;
  };
}

interface TraitFormatConfig {
  format: string;
  separator: string;
  placement: string;
  maxTraits?: number;
}

interface TraitConfig {
  enabled: boolean;
  maxTraits?: number;
  excludeTraitTypes?: string[];
  sortBy?: string[];
  discord: TraitFormatConfig;
  twitter: TraitFormatConfig;
}

@Injectable()
export class NFTMetadataService extends BaseService {
  private provider: ethers.providers.JsonRpcProvider;
  private imageCache = new Map<string, string>();
  private traitsCache = new Map<string, NFTTraits>();

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

  private async fetchMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata> {
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
      metadataUrl = await this.resolveIPFSUrl(metadataUrl);
    }

    // Fetch metadata
    const response = await fetch(metadataUrl);
    return await response.json();
  }

  async getImageUrl(contractAddress: string, tokenId: string): Promise<string> {
    const cacheKey = `${contractAddress}-${tokenId}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }

    try {
      const metadata = await this.fetchMetadata(contractAddress, tokenId);
      let imageUrl = metadata.image;
      
      // Handle IPFS image URLs
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = await this.resolveIPFSUrl(imageUrl);
      }

      // Cache the result
      this.imageCache.set(cacheKey, imageUrl);
      
      return imageUrl;
    } catch (error) {
      console.error('Error fetching NFT image:', error);
      return null;
    }
  }

  async getTraits(contractAddress: string, tokenId: string): Promise<NFTTraits> {
    const cacheKey = `${contractAddress}-${tokenId}`;
    if (this.traitsCache.has(cacheKey)) {
      return this.traitsCache.get(cacheKey);
    }

    try {
      const metadata = await this.fetchMetadata(contractAddress, tokenId);
      const traits = metadata.attributes || [];

      // Format traits for Discord and Twitter
      const formattedTraits = this.formatTraits(traits);
      
      const result = {
        traits,
        formattedTraits
      };

      // Cache the result
      this.traitsCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching NFT traits:', error);
      return {
        traits: [],
        formattedTraits: {
          discord: '',
          twitter: ''
        }
      };
    }
  }

  private formatTraits(traits: { trait_type: string; value: string | number }[]): { discord: string; twitter: string } {
    if (!traits || traits.length === 0) {
      return {
        discord: '',
        twitter: ''
      };
    }

    // Get trait display configuration
    const traitConfig = (this.config.traits || {
      enabled: true,
      maxTraits: 5,
      excludeTraitTypes: [],
      discord: {
        format: '**{trait_type}**: {value}',
        separator: '\n',
        placement: '{traits}',
        maxTraits: 5
      },
      twitter: {
        format: '{trait_type}: {value}',
        separator: ' | ',
        placement: '{traits}',
        maxTraits: 3
      }
    }) as TraitConfig;

    // If traits are disabled, return empty strings
    if (traitConfig.enabled === false) {
      return {
        discord: '',
        twitter: ''
      };
    }

    // Filter out excluded trait types
    const filteredTraits = traits.filter(trait => 
      !traitConfig.excludeTraitTypes?.includes(trait.trait_type)
    );

    // Sort traits by trait_type if specified in config
    if (traitConfig.sortBy) {
      filteredTraits.sort((a, b) => {
        const indexA = traitConfig.sortBy.indexOf(a.trait_type);
        const indexB = traitConfig.sortBy.indexOf(b.trait_type);
        return indexA - indexB;
      });
    }

    // Format for Discord with Discord-specific limit
    const discordMaxTraits = traitConfig.discord.maxTraits ?? traitConfig.maxTraits ?? filteredTraits.length;
    const discordTraits = filteredTraits.slice(0, discordMaxTraits).map(trait => 
      traitConfig.discord.format
        .replace('{trait_type}', trait.trait_type)
        .replace('{value}', trait.value.toString())
    );

    // Add truncation indicator for Discord if needed
    const discordText = discordTraits.join(traitConfig.discord.separator);
    const discordResult = discordTraits.length < filteredTraits.length
      ? discordText + traitConfig.discord.separator + '...'
      : discordText;

    // Format for Twitter with Twitter-specific limit
    const twitterMaxTraits = traitConfig.twitter.maxTraits ?? traitConfig.maxTraits ?? filteredTraits.length;
    const twitterTraits = filteredTraits.slice(0, twitterMaxTraits).map(trait =>
      traitConfig.twitter.format
        .replace('{trait_type}', trait.trait_type)
        .replace('{value}', trait.value.toString())
    );

    // For Twitter, we need to ensure we don't exceed character limit
    const twitterText = twitterTraits.join(traitConfig.twitter.separator);
    let wasTwitterTruncated = false;
    
    // Twitter's limit is 280 chars, but we need to leave room for the rest of the message
    if (twitterText.length > 100) {  // Arbitrary limit, adjust based on your message template
      // Try reducing traits one by one until we're under limit
      while (twitterTraits.length > 0 && twitterTraits.join(traitConfig.twitter.separator).length > 100) {
        twitterTraits.pop();
        wasTwitterTruncated = true;
      }
    }

    // Add truncation indicator for Twitter if needed
    const finalTwitterText = twitterTraits.join(traitConfig.twitter.separator);
    const twitterResult = wasTwitterTruncated || twitterTraits.length < filteredTraits.length
      ? finalTwitterText + ' ...'
      : finalTwitterText;

    return {
      discord: discordResult,
      twitter: twitterResult
    };
  }
} 