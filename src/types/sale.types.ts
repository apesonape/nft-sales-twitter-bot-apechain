// sale.types.ts
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
  twitterMessage: string;
  transferCount: number;
  traits?: {
    trait_type: string;
    value: string | number;
  }[];
  formattedTraits?: {
    discord: string;
    twitter: string;
  };
}
