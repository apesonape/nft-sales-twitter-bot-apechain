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
      if (this.config.debug_mode) {
        console.log('Tweet filter check:', {
          isBulkSale: saleData.isBulkSale,
          isWapeSale: saleData.isWapeSale,
          count: saleData.count,
          price: saleData.price,
          minBulkCount: this.config.tweetFilters.minBulkPurchaseCount,
          minPrice: saleData.isWapeSale 
            ? this.config.tweetFilters.minSingleSalePrice.wape 
            : this.config.tweetFilters.minSingleSalePrice.ape
        });
      }
      console.log('Tweet filtered out based on configuration');
      return;
    }

    let mediaIds: string[] = [];
    try {
      // Upload images if available (up to 4)
      if (saleData.imageUrls && saleData.imageUrls.length > 0) {
        const validImageUrls = saleData.imageUrls.filter(url => url !== null);
        
        if (validImageUrls.length > 0) {
          if (this.config.debug_mode) {
            console.log(`Attempting to upload ${Math.min(4, validImageUrls.length)} images to Twitter...`);
          }
          
          const imagesToUpload = validImageUrls.slice(0, 4);
          
          for (const imageUrl of imagesToUpload) {
            try {
              if (this.config.debug_mode) {
                console.log(`Downloading image: ${imageUrl}`);
              }
              const imageBuffer = await this.downloadImage(imageUrl);
              
              if (this.config.debug_mode) {
                console.log('Successfully downloaded image, uploading to Twitter...');
              }
              
              const mediaId = await this.client.v1.uploadMedia(imageBuffer, { mimeType: 'image/webp' });
              if (this.config.debug_mode) {
                console.log(`Successfully uploaded image, received media ID: ${mediaId}`);
              }
              mediaIds.push(mediaId);
            } catch (uploadError) {
              console.error('Failed to upload image to Twitter');
              if (this.config.debug_mode) {
                console.error('Upload error details:', uploadError);
                if (uploadError.data?.errors) {
                  console.error('Twitter API errors:', uploadError.data.errors);
                }
              }
            }
          }
          
          if (this.config.debug_mode) {
            console.log(`Successfully uploaded ${mediaIds.length} out of ${imagesToUpload.length} images`);
          }
        }
      }

      const tweetData: any = {
        text: saleData.twitterMessage,
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
      };

      if (this.config.debug_mode) {
        console.log('Sending tweet with data:', JSON.stringify(tweetData, null, 2));
      }

      const tweet = await this.client.v2.tweet(tweetData);
      console.log(`Tweet sent: ${saleData.twitterMessage}`);
      
      if (this.config.debug_mode) {
        console.log('Tweet ID:', tweet.data.id);
      }
    } catch (error) {
      if (error.code === 429) {
        const dayLimit = error.rateLimit?.day;
        if (dayLimit) {
          console.error(`Twitter rate limit reached - Daily limit: ${dayLimit.limit}, Reset in: ${Math.round((dayLimit.reset - Date.now()/1000)/3600)} hours`);
        } else {
          console.error('Twitter rate limit reached');
        }
      } else {
        console.error('Failed to send tweet');
      }

      if (this.config.debug_mode) {
        console.error('Error details:', error);
        if (error.data?.errors) {
          console.error('Twitter API errors:', error.data.errors);
        }
        if (error.errors) {
          console.error('Twitter API errors:', error.errors);
        }
        console.error('Tweet data that failed:', {
          text: saleData.twitterMessage,
          mediaCount: mediaIds.length
        });
      }
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