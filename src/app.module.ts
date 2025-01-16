import { Module } from '@nestjs/common';
import { MagicEdenSalesService } from './services/magiceden-sales.service';
import { NFTMetadataService } from './services/nft-metadata.service';
import { DiscordService } from './services/discord.service';
import { TwitterService } from './services/twitter.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    MagicEdenSalesService,
    NFTMetadataService,
    DiscordService,
    TwitterService
  ],
})
export class AppModule {} 