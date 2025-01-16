import { ColorResolvable, EmbedBuilder } from 'discord.js';
import { config } from '../config';

const SHOW_TRAITS = config.traits.enabled;  // Extract the `enabled` flag from the traits config
const COLLECTION_NAME = config.collection_name;  // Get the collection name from config
const FOOTER_TEXT = config.discord.footerText;  // Centralized footer text

/**
 * Creates a Discord embed message for a single purchase of an "Apes on Ape" NFT.
 * 
 * @param tokenId The ID of the NFT that was bought.
 * @param price The price of the NFT in APE.
 * @param marketplace The marketplace where the NFT was bought.
 * @param itemUrl The URL to the item's page.
 * @param traits The traits of the NFT.
 * 
 * @returns The Discord embed message for the purchase.
 */
function createBuyMessage(
  tokenId: string,
  price: string,
  marketplace: string,
  itemUrl: string,
  imgUrl: string,
  traits: string
) {
  return new EmbedBuilder()
    .setColor(config.discord.buyMessage.color as ColorResolvable)
    .setTitle(config.discord.buyMessage.title)
    .setDescription(
      `🎉 **${COLLECTION_NAME} #${tokenId}** has been snagged for **${price} APE** on **${marketplace}**!\n[View NFT](<${itemUrl}>)`
    )
    .setImage(imgUrl)
    .addFields(
      // { name: '🛒 Marketplace', value: marketplace, inline: true },
      // { name: '💰 Price', value: `${price} APE`, inline: true },
      // { name: '🔢 Token ID', value: `#${tokenId}`, inline: true },
      ...(SHOW_TRAITS ? [{ name: '🎨 Traits', value: traits || 'No traits available', inline: false }] : [])
    )
    .setURL(itemUrl)
    .setTimestamp()
    .setFooter({
      text: FOOTER_TEXT
    });
}

/**
 * Creates a Discord embed message for a single sale of an "Apes on Ape" NFT.
 * 
 * @param tokenId The ID of the NFT that was sold.
 * @param price The price of the NFT in WAPE.
 * @param marketplace The marketplace where the NFT was sold.
 * @param itemUrl The URL to the item's page.
 * @param traits The traits of the NFT.
 * @returns The Discord embed message for the sale.
 */
function createSaleMessage(
  tokenId: string,
  price: string,
  marketplace: string,
  itemUrl: string,
  imgUrl: string,
  traits: string
) {
  return new EmbedBuilder()
    .setColor(config.discord.saleMessage.color as ColorResolvable)
    .setTitle(config.discord.saleMessage.title)
    .setDescription(
      `🔥 **${COLLECTION_NAME} #${tokenId}** was sold for **${price} WAPE** on **${marketplace}**!\n[View NFT](<${itemUrl}>)`
    )
    .setImage(imgUrl)
    .addFields(
      // { name: '🛒 Marketplace', value: marketplace, inline: true },
      // { name: '💰 Price', value: `${price} WAPE`, inline: true },
      // { name: '🔢 Token ID', value: `#${tokenId}`, inline: true },
      ...(SHOW_TRAITS ? [{ name: '🎨 Traits', value: traits || 'No traits available', inline: false }] : [])
    )
    .setURL(itemUrl)
    .setTimestamp()
    .setFooter({
      text: FOOTER_TEXT
    });
}

/**
 * Creates a Discord embed message for a bulk purchase (sweep) of multiple "Apes on Ape" NFTs.
 * 
 * @param count The number of NFTs purchased.
 * @param totalPrice The total price paid for the NFTs in APE.
 * @param marketplace The marketplace where the NFTs were purchased.
 * @param txUrl The URL to the transaction on the blockchain.
 * @param imgUrl The image of the NFT.
 * @returns The Discord embed message for the bulk purchase.
 */
function createBulkBuyMessage(
  count: number,
  totalPrice: string,
  marketplace: string,
  txUrl: string,
  imgUrl: string
) {
  const totalPriceNum = parseFloat(totalPrice);
  const avgPrice = count > 0 && !isNaN(totalPriceNum) ? totalPriceNum / count : 0;

  return new EmbedBuilder()
    .setColor(config.discord.bulkBuyMessage.color as ColorResolvable)
    .setTitle(config.discord.bulkBuyMessage.title)
    .setDescription(
      `✨ **${count} ${COLLECTION_NAME} NFTs** have been swept for **${totalPrice} APE** on **${marketplace}**!\n[View Transaction](<${txUrl}>)`
    )
    .setImage(imgUrl)
    .addFields(
      { name: '🛒 Sweep Details', value: `- **Count:** ${count}\n- **Total Price:** ${totalPrice} APE\n- **Avg Price:** ${avgPrice.toFixed(2)} APE` }
    )
    .setURL(txUrl)
    .setTimestamp()
    .setFooter({
      text: FOOTER_TEXT
    });
}

/**
 * Creates a Discord embed message for a bulk sale of multiple "Apes on Ape" NFTs.
 * 
 * @param count The number of NFTs sold.
 * @param totalPrice The total price received for the NFTs in WAPE.
 * @param marketplace The marketplace where the NFTs were sold.
 * @param txUrl The URL to the transaction on the blockchain.
 * @param imgUrl The image of the NFT
 * @returns The Discord embed message for the bulk sale.
 */
function createBulkSaleMessage(
  count: number,
  totalPrice: string,
  marketplace: string,
  txUrl: string,
  imgUrl: string
) {
  const totalPriceNum = parseFloat(totalPrice);
  const avgPrice = count > 0 && !isNaN(totalPriceNum) ? totalPriceNum / count : 0;

  return new EmbedBuilder()
    .setColor(config.discord.bulkSaleMessage.color as ColorResolvable)
    .setTitle(config.discord.bulkSaleMessage.title)
    .setDescription(
      `💸 **${count} ${COLLECTION_NAME} NFTs** have been sold for **${totalPrice} WAPE** on **${marketplace}**!\n[View Transaction](<${txUrl}>)`
    )
    .setImage(imgUrl)
    .addFields(
      { name: '🛒 Sale Details', value: `- **Count:** ${count}\n- **Total Price:** ${totalPrice} WAPE\n- **Avg Price:** ${avgPrice.toFixed(2)} WAPE` }
    )
    .setURL(txUrl)
    .setTimestamp()
    .setFooter({
      text: FOOTER_TEXT
    });
}
// Export the functions so they can be used elsewhere in the application
export { createSaleMessage, createBuyMessage, createBulkBuyMessage, createBulkSaleMessage };
