import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from './base.service';
import { Client, GatewayIntentBits, GuildTextBasedChannel } from 'discord.js';
import { createSaleMessage, createBulkBuyMessage, createBuyMessage, createBulkSaleMessage } from './discord-alerts';
import { MessageType } from '../types/message-types';
import { SaleData } from 'src/types/sale.types';
import { config } from '../config';

@Injectable()
export class DiscordService extends BaseService implements OnModuleInit {
  private client: Client; // Discord client instance
  private channels: Map<string, GuildTextBasedChannel> = new Map(); // Map of channel names to channel objects
  private ready = false; // Flag to check if the Discord client is ready

  /**
   * Constructor initializes the Discord client and sets up event listeners for reconnect and disconnect events.
   */
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

  /**
   * Attempts to reconnect the Discord client if disconnected.
   */
  private async reconnect() {
    try {
      if (!this.client.isReady()) {
        console.log('Attempting to reconnect Discord client...');
        await this.client.login(process.env.DISCORD_TOKEN); // Reattempt login
        await this.initializeChannels(); // Reinitialize channels
        this.ready = true;
        console.log('Discord client successfully reconnected');
      }
    } catch (error) {
      console.error('Error reconnecting Discord client:', error);
      // Retry after 5 seconds
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  /**
   * Returns the current readiness status of the Discord client.
   * @returns true if the client is ready, false otherwise.
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Initializes the Discord service by logging in the client and setting up channels.
   * This method is called when the module is initialized.
   */
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

      await this.client.login(token); // Login to Discord with the token
      console.log('Discord login successful');
    } catch (error) {
      console.error('Error initializing Discord service:', error);
      throw error;
    }
  }

  /**
   * Initializes the Discord channels based on the configuration in the environment variables.
   * This method fetches each channel and stores it in a map for later use.
   */
  private async initializeChannels() {
    console.log('Initializing Discord channels...');
    try {
      if (!this.config?.discord?.channels) {
        throw new Error('Discord channels configuration is missing or invalid');
      }
      
      console.log('Discord channels config:', this.config.discord.channels);
      
      // Iterate over all configured channels
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
            this.channels.set(channelConfig.name, channel); // Store the channel in the map
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

  /**
   * Sends a message to the configured Discord channels based on the provided message data.
   * It handles different message types (buy, sale, bulkBuy, bulkSale) and includes embedded messages with relevant details.
   * 
   * @param saleData The data related to the sale.
   */
  async sendMessage(saleData: SaleData) {
    if (!this.ready) {
      console.log('Skipping Discord message - client not ready, attempting to reconnect...');
      await this.reconnect();
      if (!this.ready) {
        console.log('Still not ready after reconnection attempt, message will be lost');
        return;
      }
    }

    try {
      // Setting up data to create message
      let messageType: MessageType;
      messageType = categorizeMessageType(saleData);

      let embed;
      const { tokenId, price, marketplace, itemUrl, count, totalPrice, txUrl, traits } = saleData;

      let nftImg = saleData.imageUrls[0];
      const formattedTraits = formatTraits(traits); // Use the helper method for traits
      console.log(traits + "<- formatted traits ");
      console.log(formattedTraits + "<- formatted traits ");

      // Create the appropriate embed based on the message type
      switch (messageType) {
        case MessageType.Buy:
          embed = createBuyMessage(tokenId, price, marketplace, itemUrl, nftImg, formattedTraits);
          break;
        case MessageType.Sale:
          embed = createSaleMessage(tokenId, price, marketplace, itemUrl, nftImg, formattedTraits);
          break;
        case MessageType.BulkBuy:
          embed = createBulkBuyMessage(count, totalPrice, marketplace, txUrl, nftImg);
          break;
        case MessageType.BulkSale:
          embed = createBulkSaleMessage(count, totalPrice, marketplace, txUrl, nftImg);
          break;
        default:
          console.error('Unknown message type:', messageType);
          return;
      }

      console.log('\nSending to Discord:', embed);

      // Iterate over all configured channels and send the message
      for (const [channelName, channel] of this.channels) {
        console.log(`Sending message to channel: ${channelName}`);
        await channel.send({
          embeds: [embed]
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

/**
 * Helper method to categorize the message type based on sale data.
 * @param saleData The data related to the sale that determines the message type.
 * @returns The appropriate message type based on the sale data.
 */
function categorizeMessageType(saleData: { isBulkSale: boolean, isWapeSale: boolean }): MessageType {
  if (saleData.isBulkSale) {
    // If it's a bulk sale, use bulkSale type
    return saleData.isWapeSale ? MessageType.BulkSale : MessageType.BulkBuy;
  } else {
    // If it's not a bulk sale, check if it's a WAPE sale
    return saleData.isWapeSale ? MessageType.Sale : MessageType.Buy;
  }
}

/**
 * Formats an array of trait objects into a string suitable for display.
 * 
 * - Filters out any trait types specified in the `excludeTraitTypes` array from the config.
 * - Converts each trait into a formatted string of "Trait Type: Trait Value".
 * - Joins all the formatted traits with a newline for readability.
 * 
 * @param traits - An array of trait objects, each containing a `trait_type` and a `value`.
 * @returns A string with all traits formatted and joined by newlines, or an empty string if no valid traits are found.
 */
function formatTraits(traits: Array<{ trait_type: string, value: string | number }>): string {
  return traits
    .filter(trait => !config.traits.excludeTraitTypes.includes(trait.trait_type)) // Exclude traits in the excludeTraitTypes array
    .map(trait => `**${trait.trait_type}:** ${String(trait.value)}`) // Format trait type and value
    .join(config.traits.discord.separator); // Join with configured separator (defaults to newline)
}