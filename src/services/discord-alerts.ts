import { EmbedBuilder } from 'discord.js';
import { config } from '../config';
const SHOW_TRAITS = config.traits.enabled; // Extract the `enabled` flag from the traits config

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
    .setColor('#0054FA') // Set a consistent blue color for the embed
    .setTitle('🚨 **BUY ALERT!** 🚨')
    .setDescription(
      `🎉 **Apes on Ape #${tokenId}** has been snagged for **${price} APE** on **${marketplace}**!\n[View NFT](<${itemUrl}>)`
    )
    .setImage(imgUrl) // Add an image showcasing the NFTs or sweep
    .addFields(
      { name: '🛒 Marketplace', value: marketplace, inline: true },
      { name: '💰 Price', value: `${price} APE`, inline: true },
      { name: '🔢 Token ID', value: `#${tokenId}`, inline: true },
      ...(SHOW_TRAITS ? [{ name: '🎨 Traits', value: traits || 'No traits available', inline: false }] : [])
    ) 
    .setURL(itemUrl) // Link to the purchased item
    .setTimestamp() // Add the timestamp for when the message was created
    .setFooter({
      text: 'Apechain - Apes on Ape NFT Bot'
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
  .setColor('#E74C3C') // Red color for sale alert
  .setTitle('🚨 **SALE ALERT!** 🚨')
  .setDescription(
    `🔥 **Apes on Ape #${tokenId}** was sold for **${price} WAPE** on **${marketplace}**!\n[View NFT](<${itemUrl}>)`
  )
  .setImage(imgUrl) // Add the NFT image
  .addFields(
    { name: '🛒 Marketplace', value: marketplace, inline: true },
    { name: '💰 Price', value: `${price} WAPE`, inline: true },
    { name: '🔢 Token ID', value: `#${tokenId}`, inline: true },
    ...(SHOW_TRAITS ? [{ name: '🎨 Traits', value: traits || 'No traits available', inline: false }] : [])
  )
  .setURL(itemUrl) // Set the link to the item
  .setTimestamp() // Add timestamp
  .setFooter({
    text: 'Apechain - Apes on Ape NFT Bot'
  });
}

/**
 * Creates a Discord embed message for a bulk purchase (sweep) of multiple "Apes on Ape" NFTs.
 * 
 * @param count The number of NFTs purchased.
 * @param totalPrice The total price paid for the NFTs in APE.
 * @param marketplace The marketplace where the NFTs were purchased.
 * @param txUrl The URL to the transaction on the blockchain.
 * @returns The Discord embed message for the bulk purchase.
 */
function createBulkBuyMessage(
  count: number,
  totalPrice: string,
  marketplace: string,
  txUrl: string,
  imgUrl
) {
  const totalPriceNum = parseFloat(totalPrice);  // Convert totalPrice string to number
  const avgPrice = count > 0 && !isNaN(totalPriceNum) ? totalPriceNum / count : 0;  // Calculate the average price per NFT

  return new EmbedBuilder()
  .setColor('#28A745') // Green color for bulk buy alert
  .setTitle('🚨 **SWEEP ALERT!** 🚨')
  .setDescription(
    `✨ **${count} Apes on Ape NFTs** have been swept for **${totalPrice} APE** on **${marketplace}**!\n[View Transaction](<${txUrl}>)`
  )
  .setImage(imgUrl)
  .addFields(
    { name: '🛒 Sweep Details', value: `- **Count:** ${count}\n- **Total Price:** ${totalPrice} APE\n- **Avg Price:** ${avgPrice.toFixed(2)} APE` }
  )
  .setURL(txUrl) // Transaction link
  .setTimestamp()
  .setFooter({
    text: 'Apechain - Apes on Ape NFT Bot'
  });
}

/**
 * Creates a Discord embed message for a bulk sale of multiple "Apes on Ape" NFTs.
 * 
 * @param count The number of NFTs sold.
 * @param totalPrice The total price received for the NFTs in WAPE.
 * @param marketplace The marketplace where the NFTs were sold.
 * @param txUrl The URL to the transaction on the blockchain.
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
  .setColor('#FFC107') // Yellow color for bulk sale alert
  .setTitle('🚨 **BULK SALE ALERT!** 🚨')
  .setDescription(
    `💸 **${count} Apes on Ape NFTs** have been sold for **${totalPrice} WAPE** on **${marketplace}**!\n[View Transaction](<${txUrl}>)`
  )
  .setImage(imgUrl) // Add an image showcasing the NFTs or sweep
  .addFields(
    { name: '🛒 Sale Details', value: `- **Count:** ${count}\n- **Total Price:** ${totalPrice} WAPE\n- **Avg Price:** ${avgPrice.toFixed(2)} WAPE` }
  ) 
  .setURL(txUrl) // Transaction link
  .setTimestamp()
  .setFooter({
    text: 'Apechain - Apes on Ape NFT Bot',
  });
}
  
// Export the functions so they can be used elsewhere in the application
export { createSaleMessage, createBuyMessage, createBulkBuyMessage, createBulkSaleMessage };
