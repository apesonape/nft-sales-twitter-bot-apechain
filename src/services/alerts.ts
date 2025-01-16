import { EmbedBuilder } from 'discord.js';

/**
 * Creates a Discord embed message for a single purchase of an "Apes on Ape" NFT.
 * 
 * @param tokenId The ID of the NFT that was bought.
 * @param price The price of the NFT in APE.
 * @param marketplace The marketplace where the NFT was bought.
 * @param buyer The buyer's address.
 * @param seller The seller's address.
 * @param itemUrl The URL to the item's page.
 * @param traits The traits of the NFT.
 * @returns The Discord embed message for the purchase.
 */
function createBuyMessage(
  tokenId: string,
  price: string,
  marketplace: string,
  buyer: string,
  seller: string,
  itemUrl: string,
  traits: Array<{ trait_type: string, value: string | number }> // Assuming traits is an array
) {
  // Format traits into a clean list or string
  const formattedTraits = traits
    .map(trait => `**${trait.trait_type}:** ${String(trait.value)}`) // Format trait type and value
    .join('\n'); // Join with newlines for readability

  return new EmbedBuilder()
    .setColor('#3498db') // Set the embed color (blue for buy alert)
    .setTitle('🚨🚨 BUY ALERT 🚨🚨') // Set the title of the embed
    .setDescription(`**Apes on Ape #${tokenId}** has been purchased for **${price} APE** on **${marketplace}**!`) // Set the description with purchase details
    .addFields(
      { name: '🛒 Transaction Details:', value: `- **Token ID:** ${tokenId}\n- **Collection:** Apes on Ape` }, // Add field for transaction details
      { name: 'Buyer:', value: `[${buyer}](https://apescan.io/address/${buyer})`, inline: true }, // Add buyer field with clickable address link
      { name: 'Seller:', value: `[${seller}](https://apescan.io/address/${seller})`, inline: true }, // Add seller field with clickable address link
      { name: 'Traits:', value: formattedTraits || 'No traits available' } // Add formatted traits field
    )
    .setURL(itemUrl) // Set the item URL for easy access to the NFT
    .setTimestamp() // Add a timestamp to the embed
    .setFooter({ text: 'Apechain - Apes on Ape NFT Bot'}); // Set footer for the embed
}


/**
 * Creates a Discord embed message for a single sale of an "Apes on Ape" NFT.
 * 
 * @param tokenId The ID of the NFT that was sold.
 * @param price The price of the NFT in WAPE.
 * @param marketplace The marketplace where the NFT was sold.
 * @param buyer The buyer's address.
 * @param seller The seller's address.
 * @param itemUrl The URL to the item's page.
 * @param traits The traits of the NFT.
 * @returns The Discord embed message for the sale.
 */
function createSaleMessage(
    tokenId: string,
    price: string,
    marketplace: string,
    buyer: string,
    seller: string,
    itemUrl: string,
    traits: Array<{ trait_type: string, value: string | number }> // Assuming traits is an array
) {
    // Format traits into a clean list or string
    const formattedTraits = traits
        .map(trait => `**${trait.trait_type}:** ${String(trait.value)}`) // Format trait type and value
        .join('\n'); // Join with newlines for readability

    return new EmbedBuilder()
        .setColor('#e74c3c') // Set the embed color (red for sale alert)
        .setTitle('🚨🚨 SALE ALERT 🚨🚨') // Set the title of the embed
        .setDescription(`**Apes on Ape #${tokenId}** has been sold for **${price} WAPE** on **${marketplace}**!`) // Set the description with sale details
        .addFields(
        { name: '🛒 Transaction Details:', value: `- **Token ID:** ${tokenId}\n- **Collection:** Apes on Ape` }, // Add field for transaction details
        { name: 'Buyer:', value: `[${buyer}](https://apescan.io/address/${buyer})`, inline: true }, // Add buyer field with clickable address link
        { name: 'Seller:', value: `[${seller}](https://apescan.io/address/${seller})`, inline: true }, // Add seller field with clickable address link
        { name: 'Traits:', value: formattedTraits || 'No traits available' } // Add formatted traits field
        )
        .setURL(itemUrl) // Set the item URL for easy access to the NFT
        .setTimestamp() // Add a timestamp to the embed
        .setFooter({ text: 'Apechain - Apes on Ape NFT Bot'}); // Set footer for the embed
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
  txUrl: string
) {
  const totalPriceNum = parseFloat(totalPrice);  // Convert totalPrice string to number
  const avgPrice = count > 0 && !isNaN(totalPriceNum) ? totalPriceNum / count : 0;  // Calculate the average price per NFT

  return new EmbedBuilder()
    .setColor('#f1c40f') // Set the embed color (yellow for bulk buy alert)
    .setTitle('🚨🚨 SWEEP ALERT 🚨🚨') // Set the title of the embed
    .setDescription(`**${count} Apes on Ape** have been purchased for **${totalPrice} APE** on **${marketplace}**!`) // Set the description with purchase details
    .addFields(
      { name: '🛒 Transaction Details:', value: `- **Total Count:** ${count}\n- **Total Price:** ${totalPrice} APE\n- **Average Price:** ${avgPrice.toFixed(2)} APE` } // Add transaction details including average price
    )
    .setURL(txUrl) // Set the transaction URL for easy access to the blockchain transaction
    .setTimestamp() // Add a timestamp to the embed
    .setFooter({ text: 'Apechain - Apes on Ape NFT Bot'}); // Set footer for the embed
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
  txUrl: string
) {
  const totalPriceNum = parseFloat(totalPrice);  // Convert totalPrice string to number
  const avgPrice = count > 0 && !isNaN(totalPriceNum) ? totalPriceNum / count : 0;  // Calculate the average price per NFT

  return new EmbedBuilder()
    .setColor('#9b59b6') // Set the embed color (purple for bulk sale alert)
    .setTitle('🚨🚨 BULK SALE ALERT 🚨🚨') // Set the title of the embed
    .setDescription(`**${count} Apes on Ape** have been sold for **${totalPrice} WAPE** on **${marketplace}**!`) // Set the description with sale details
    .addFields(
      { name: '🛒 Transaction Details:', value: `- **Total Count:** ${count}\n- **Total Price:** ${totalPrice} WAPE\n- **Average Price:** ${avgPrice.toFixed(2)} WAPE` } // Add transaction details including average price
    )
    .setURL(txUrl) // Set the transaction URL for easy access to the blockchain transaction
    .setTimestamp() // Add a timestamp to the embed
    .setFooter({ text: 'Apechain - Apes on Ape NFT Bot', iconURL: process.env.ICON_URL }); // Set footer with an icon URL
}

// Export the functions so they can be used elsewhere in the application
export { createSaleMessage, createBuyMessage, createBulkBuyMessage, createBulkSaleMessage };
