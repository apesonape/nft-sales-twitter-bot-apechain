import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from './base.service';
import { Client, GatewayIntentBits, TextChannel, BaseGuildTextChannel, GuildTextBasedChannel } from 'discord.js';
import { DiscordMessageData } from '../types/sale.types';

// Define interfaces for our config types
interface ChannelTemplates {
  saleMessage?: string;
  wapeSaleMessage?: string;
  bulkSaleMessage?: string;
  bulkWapeSaleMessage?: string;
}

interface ChannelConfig {
  id: string;
  name: string;
  templates?: ChannelTemplates;
}

@Injectable()
export class DiscordService extends BaseService implements OnModuleInit {
  private client: Client;
  private channels: Map<string, GuildTextBasedChannel> = new Map();
  private ready = false;

  constructor() {
    super();
    console.log('Discord service constructor called');
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ]
    });

    // Set up disconnect handler
    this.client.on('disconnect', () => {
      console.log('Discord client disconnected, attempting to reconnect...');
      this.ready = false;
      this.reconnect();
    });

    // Set up reconnect handler
    this.client.on('reconnecting', () => {
      console.log('Discord client reconnecting...');
      this.ready = false;
    });

    // Set up resume handler
    this.client.on('resume', () => {
      console.log('Discord client resumed connection');
      this.ready = true;
    });
  }

  private async reconnect() {
    try {
      if (!this.client.isReady()) {
        console.log('Attempting to reconnect Discord client...');
        await this.client.login(process.env.DISCORD_TOKEN);
        await this.initializeChannels();
        this.ready = true;
        console.log('Discord client successfully reconnected');
      }
    } catch (error) {
      console.error('Error reconnecting Discord client:', error);
      // Try again in 5 seconds
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async onModuleInit() {
    console.log('Discord service initializing...');
    try {
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        throw new Error('Discord token not found in environment variables');
      }
      console.log('Discord token found, attempting to login...');

      // Set up ready event handler before login
      this.client.once('ready', async () => {
        console.log('Discord client ready event received');
        try {
          await this.initializeChannels();
          this.ready = true;
          console.log('Discord service is now fully initialized and ready');
          this.emit('ready');
        } catch (error) {
          console.error('Error in Discord ready event handler:', error);
          // Don't set ready to true if initialization failed
          this.emit('error', error);
        }
      });

      // Set up error handler
      this.client.on('error', (error) => {
        console.error('Discord client error:', error);
        this.emit('error', error);
      });

      await this.client.login(token);
      console.log('Discord login successful');
    } catch (error) {
      console.error('Error initializing Discord service:', error);
      throw error;
    }
  }

  private async initializeChannels() {
    console.log('Initializing Discord channels...');
    try {
      if (!this.config?.discord?.channels) {
        throw new Error('Discord channels configuration is missing or invalid');
      }
      
      console.log('Discord channels config:', this.config.discord.channels);
      
      for (const channelConfig of this.config.discord.channels) {
        if (!channelConfig.id) {
          console.error(`Missing channel ID for channel: ${channelConfig.name}`);
          continue;
        }
        
        console.log(`Attempting to fetch channel: ${channelConfig.name} (${channelConfig.id})`);
        try {
          const channel = await this.client.channels.fetch(channelConfig.id) as GuildTextBasedChannel;
          
          if (channel) {
            console.log(`Channel fetched successfully: ${channel.name} (${channel.id})`);
            this.channels.set(channelConfig.name, channel);
            console.log(`Successfully connected to channel: ${channelConfig.name} (${channel.name})`);
            console.log(`Current channels in Map: ${Array.from(this.channels.keys()).join(', ')}`);
          } else {
            console.error(`Failed to fetch channel: ${channelConfig.name} (${channelConfig.id})`);
          }
        } catch (channelError) {
          console.error(`Error fetching channel ${channelConfig.name}:`, channelError);
        }
      }
      
      console.log(`Connected to ${this.channels.size} Discord channel(s)`);
      if (this.channels.size === 0) {
        throw new Error('No channels were successfully initialized');
      }
    } catch (error) {
      console.error('Error initializing Discord channels:', error);
      throw error; // Re-throw to handle in the ready event
    }
  }

  private getMessageTemplate(channelConfig: ChannelConfig, templateName: string): string {
    return channelConfig.templates?.[templateName] || this.config.discord.templates[templateName];
  }

  async sendMessage(messageData: DiscordMessageData) {
    if (!this.ready) {
      console.log('Skipping Discord message - client not ready, attempting to reconnect...');
      await this.reconnect();
      if (!this.ready) {
        console.log('Still not ready after reconnection attempt, message will be lost');
        return;
      }
    }

    try {
      // Log the message content
      console.log('\nSending to Discord:', messageData.message);
      
      const validImageUrls = messageData.imageUrls.filter(url => url !== null);
      const files = validImageUrls.map(url => {
        // Check if URL already has an extension
        const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        if (hasExtension) {
          return { attachment: url }; // Keep original URL if it has an extension
        }
        
        // Default to .jpg if no extension (can be adjusted based on content-type if needed)
        return { 
          attachment: url,
          name: 'nft-image.jpg'
        };
      });

      for (const [channelName, channel] of this.channels) {
        console.log(`Sending message to channel: ${channelName}`);
        await channel.send({
          content: messageData.message,
          files
        });
        console.log(`Successfully sent message to channel: ${channelName}`);
      }
    } catch (error) {
      console.error('Error sending Discord message:', error);
      if (error.message?.includes('other side closed') || error.code === 'UND_ERR_SOCKET') {
        console.log('Connection error detected, attempting to reconnect...');
        this.ready = false;
        await this.reconnect();
      }
    }
  }
} 