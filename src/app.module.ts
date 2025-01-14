import { Module } from '@nestjs/common';
import { MagicEdenSalesService } from './services/magiceden-sales.service';
import { NFTImageService } from './services/nft-image.service';
import { DiscordService } from './services/discord.service';
import { TwitterService } from './services/twitter.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    MagicEdenSalesService,
    NFTImageService,
    DiscordService,
    TwitterService
  ],
})
export class AppModule {} 