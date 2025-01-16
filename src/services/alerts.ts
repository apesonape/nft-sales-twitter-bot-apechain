import { EmbedBuilder } from 'discord.js';

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
  traits: Array<{ trait_type: string, value: string | number }>
) {
  const formattedTraits = formatTraits(traits); // Use the helper method for traits

  return new EmbedBuilder()
    .setColor('#3498db') // Set a consistent blue color for the embed
    .setTitle('🚨 **BUY ALERT!** 🚨')
    .setDescription(
      `🎉 **Apes on Ape #${tokenId}** has been snagged for **${price} APE** on **${marketplace}**!\n[View NFT](<${itemUrl}>)`
    )
    .setImage(imgUrl) // Add an image showcasing the NFTs or sweep
    .addFields(
      { name: '🛒 Marketplace', value: marketplace, inline: true },
      { name: '💰 Price', value: `${price} APE`, inline: true },
      { name: '🔢 Token ID', value: `#${tokenId}`, inline: true },
      { name: '🎨 Traits', value: formattedTraits || 'No traits available', inline: false }
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
    traits: Array<{ trait_type: string, value: string | number }> // Assuming traits is an array
) {
    // Format traits into a clean list or string
    const formattedTraits = formatTraits(traits)

    return new EmbedBuilder()
    .setColor('#e74c3c') // Red color for sale alert
    .setTitle('🚨 **SALE ALERT!** 🚨')
    .setDescription(
      `🔥 **Apes on Ape #${tokenId}** was sold for **${price} WAPE** on **${marketplace}**!\n[View NFT](<${itemUrl}>)`
    )
    .setImage(imgUrl) // Add the NFT image
    .addFields(
      { name: '🛒 Marketplace', value: marketplace, inline: true },
      { name: '💰 Price', value: `${price} WAPE`, inline: true },
      { name: '🔢 Token ID', value: `#${tokenId}`, inline: true },
      { name: '🎨 Traits', value: formattedTraits || 'No traits available', inline: false }
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
  .setColor('#f1c40f') // Yellow color for bulk buy alert
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
    .setColor('#9b59b6') // Purple color for bulk sale alert
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
  

function formatTraits(traits: Array<{ trait_type: string, value: string | number }>): string {
  return traits
    .filter(trait => trait.trait_type.toLowerCase() !== 'background') // Exclude 'Background' trait
    .map(trait => `**${trait.trait_type}:** ${String(trait.value)}`) // Format trait type and value
    .join('\n'); // Join with newlines for readability
}

// Export the functions so they can be used elsewhere in the application
export { createSaleMessage, createBuyMessage, createBulkBuyMessage, createBulkSaleMessage };
