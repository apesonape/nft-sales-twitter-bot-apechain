import { MessageType } from "../types/message-types";

/**
 * Helper method to categorize the message type based on sale data.
 * @param saleData The data related to the sale that determines the message type.
 * @returns The appropriate message type based on the sale data.
 */
export function categorizeMessageType(saleData: { isBulkSale: boolean, isWapeSale: boolean }): MessageType {
    if (saleData.isBulkSale) {
      // If it's a bulk sale, use bulkSale type
      return saleData.isWapeSale ? MessageType.BulkSale : MessageType.BulkBuy;
    } else {
      // If it's not a bulk sale, check if it's a WAPE sale
      return saleData.isWapeSale ? MessageType.Sale : MessageType.Buy;
    }
  }
  
  