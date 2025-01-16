// discord.types.ts

import { SaleData } from './sale.types'; 
import { MessageType } from './message-types';

export interface DiscordMessageData {
  type: MessageType;
  message: string;
  imageUrls: string[];
  saleData: SaleData;
}
