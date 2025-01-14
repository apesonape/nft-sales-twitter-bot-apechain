export interface SaleData {
  tokenId: string;
  displayTokenId: string;
  price: string;
  totalPrice: string;
  count: number;
  marketplace: string;
  buyer: string;
  seller: string;
  transactionHash: string;
  isBulkSale: boolean;
  isWapeSale: boolean;
  itemUrl: string;
  txUrl: string;
  imageUrls: string[];
  message: string;
  discordMessage: string;
  twitterMessage: string;
  transferCount: number;
}

export interface DiscordMessageData {
  message: string;
  imageUrls: string[];
} 