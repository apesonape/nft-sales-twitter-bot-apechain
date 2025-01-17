import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { SaleData } from '../types/sale.types';

@Injectable()
export class TwitterService extends BaseService {
  private client: TwitterApi;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient() {
    if (!process.env.TWITTER_API_KEY) {
      console.log('Twitter credentials not configured, skipping initialization');
      return;
    }

    if (this.config.debug_mode) {
      console.log('Twitter credentials check:', {
        hasApiKey: !!process.env.TWITTER_API_KEY,
        hasApiSecret: !!process.env.TWITTER_API_SECRET,
        hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
        hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET
      });
    }

    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    console.log('Twitter client initialized');
  }

  private shouldTweet(saleData: SaleData): boolean {
    if (!this.config.tweetFilters.enabled) {
      return true;
    }

    // Log the sale details first
    console.log(`\nSale Details:
    Type: ${saleData.transferCount > 1 ? 'Bulk Sale' : 'Single Sale'}
    NFTs: ${saleData.transferCount}
    Price: ${saleData.price} ${saleData.isWapeSale ? 'WAPE' : 'APE'}
    Token ID: ${saleData.tokenId}`);

    // For bulk sales
    if (saleData.transferCount > 1) {
      if (saleData.transferCount < this.config.tweetFilters.minBulkPurchaseCount) {
        console.log(`Tweet filtered: Bulk sale count (${saleData.transferCount}) below minimum (${this.config.tweetFilters.minBulkPurchaseCount})`);
        return false;
      }
      if (saleData.isWapeSale && this.config.tweetFilters.skipBulkWapeSales) {
        console.log('Tweet filtered: Bulk WAPE sale');
        return false;
      }
    } else {
      // For single sales
      const minPrice = saleData.isWapeSale 
        ? this.config.tweetFilters.minSingleSalePrice.wape 
        : this.config.tweetFilters.minSingleSalePrice.ape;
      
      if (parseFloat(saleData.price) < parseFloat(minPrice)) {
        console.log(`Tweet filtered: Price (${saleData.price}) below minimum (${minPrice})`);
        return false;
      }
    }

    console.log('Tweet criteria met, will post tweet');
    return true;
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  async postTweet(saleData: SaleData) {
    if (!this.client) {
      console.log('Twitter client not initialized, skipping tweet');
      return;
    }
  
    if (!this.shouldTweet(saleData)) {
      console.log('Tweet filtered out based on configuration');
      return;
    }
  
    // Format traits for the tweet
    const formattedTraits = saleData.formattedTraits?.twitter || '';
  
    // Prepare the tweet text
    let tweetText = '';
    if (saleData.isBulkSale) {
      tweetText = saleData.isWapeSale
        ? this.config.twitter.bulkWapeSaleMessage
        : this.config.twitter.bulkSaleMessage;
    } else {
      tweetText = saleData.isWapeSale
        ? this.config.twitter.wapeSaleMessage
        : this.config.twitter.saleMessage;
    }

    const totalPriceNum = parseFloat(saleData.totalPrice);
    const avgPrice = saleData.count > 0 && !isNaN(totalPriceNum) ? totalPriceNum / saleData.count : 0;
  
    // Replace placeholders with actual data
    tweetText = tweetText
      .replace('{tokenId}', saleData.tokenId)
      .replace('{price}', saleData.price)
      .replace('{marketplace}', saleData.marketplace)
      .replace('{traits}', formattedTraits)
      .replace('{itemUrl}', saleData.itemUrl || '')
      .replace('{count}', saleData.count.toString())
      .replace('{totalPrice}', saleData.totalPrice.toString())
      .replace('{avgPrice}', avgPrice.toFixed(2))
      .replace('{txUrl}', saleData.txUrl || '');
  
    // Log tweet text for debugging
    if (this.config.debug_mode) {
      console.log('Formatted tweet text:', tweetText);
    }
  
    let mediaIds: string[] = [];
    try {
      if (saleData.imageUrls?.length > 0) {
        const imagesToUpload = saleData.imageUrls.slice(0, 4);
        for (const imageUrl of imagesToUpload) {
          try {
            const imageBuffer = await this.downloadImage(imageUrl);
            const mediaId = await this.client.v1.uploadMedia(imageBuffer, { mimeType: 'image/webp' });
            mediaIds.push(mediaId);
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError);
          }
        }
      }
  
      const tweetData: any = {
        text: tweetText,
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
      };
  
      const tweet = await this.client.v2.tweet(tweetData);
      console.log(`Tweet sent: ${tweetText}`);
    } catch (error) {
      console.error('Failed to send tweet:', error);
    }
  }  

  async generateAuthUrl() {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      console.log('Twitter API credentials not configured');
      return;
    }

    // Create a client with just the app credentials
    const tempClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
    });

    try {
      // Get authorization URL and save the oauth token secret
      const { url, oauth_token, oauth_token_secret } = await tempClient.generateAuthLink();
      
      console.log('\n=== STEP 1: Save these values ===');
      console.log('OAuth Token:', oauth_token);
      console.log('OAuth Token Secret:', oauth_token_secret);
      
      console.log('\n=== STEP 2: Visit this URL ===');
      console.log(url);  // URL on its own line
      
      console.log('\n=== STEP 3: After authorization ===');
      console.log('You will receive a PIN. Run this command with your values:');
      console.log(`npx ts-node src/generate-auth.ts ${oauth_token} ${oauth_token_secret} <your-pin>\n`);
      
      return { url, oauth_token, oauth_token_secret };
    } catch (error) {
      console.error('Error generating auth URL:', error);
    }
  }

  async generateAccessToken(oauthToken: string, oauthTokenSecret: string, pin: string) {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      console.log('Twitter API credentials not configured');
      return;
    }

    // Create a client with the OAuth tokens
    const tempClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: oauthToken,
      accessSecret: oauthTokenSecret,
    });

    try {
      // Get the permanent tokens using the PIN
      const { accessToken, accessSecret } = await tempClient.login(pin);
      
      console.log('\nHere are your permanent access tokens:');
      console.log('Access Token:', accessToken);
      console.log('Access Secret:', accessSecret);
      console.log('\nAdd these to your .env file as:');
      console.log('TWITTER_ACCESS_TOKEN=', accessToken);
      console.log('TWITTER_ACCESS_SECRET=', accessSecret);
      
      return { accessToken, accessSecret };
    } catch (error) {
      console.error('Error generating access token:', error);
    }
  }
} 

