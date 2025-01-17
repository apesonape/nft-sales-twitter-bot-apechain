import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MagicEdenSalesService } from './services/magiceden-sales.service';
import { DiscordService } from './services/discord.service';
import { TwitterService } from './services/twitter.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Initialize the application first
  await app.init();
  
  const salesService = app.get(MagicEdenSalesService);
  const discordService = app.get(DiscordService);
  const twitterService = app.get(TwitterService);

  // Initialize services
  await salesService.initialize();
  console.log('Initialized Magic Eden sales monitor');

  // Wait for Discord to be ready
  console.log('Waiting for Discord to be ready...');
  await new Promise<void>((resolve) => {
    if (discordService.isReady()) {
      console.log('Discord is ready');
      resolve();
    } else {
      discordService.once('ready', () => {
        console.log('Discord is ready');
        resolve();
      });

      discordService.once('error', (error) => {
        console.error('Discord initialization error:', error);
        // Still resolve to allow the application to continue
        resolve();
      });
    }
  });

  // Listen for sale events and send to Discord and Twitter
  salesService.on('sale', async (saleData) => {
    // Always send to Discord
    await discordService.sendMessage(saleData);

    // Conditionally send to Twitter based on filters
    await twitterService.postTweet(saleData);
  });

  console.log('Listening for sales...');

  // Keep the application running
  await new Promise(() => {});
}

bootstrap().catch(error => {
  console.error('Bootstrap error:', error);
  process.exit(1);
}); 
