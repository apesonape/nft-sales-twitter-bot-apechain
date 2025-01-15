export const config = {
  contract_address: '0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0',
  contract_deployment_block: 7832296,
  collection_name: 'Apechain',
  token_id_offset: 1,
  use_local_images: false,
  image_api_url: 'APECHAIN_METADATA_BASE_URL',
  
  // Magic Eden marketplace config
  marketplaces: {
    magiceden: {
      name: 'Magic Eden',
      addresses: [
        '0x0000000000000068F116a894984e2DB1123eB395',  // Main ME contract
        '0x1d3a594EAf472ca2ceC2A8aE44478c06d6A37E22',  // Additional ME contract
        '0x224ecB4Eae96d31372D1090c3B0233C8310dBbaB'   // Another ME contract we've seen
      ],
      icon: './platform_images/magiceden.png',
      item_url: 'https://magiceden.io/item-details/apechain/{contract}/{tokenId}'
    }
  },

  // Explorer config
  explorer: {
    tx_url: 'https://apescan.io/tx/{txHash}'
  },

  // Discord config
  discord: {
    channels: [
      {
        id: process.env.DISCORD_CHANNEL_ID,  // Main channel
        name: 'main',
        // Use default templates
      },
      {
        id: process.env.DISCORD_ANNOUNCEMENTS_ID,
        name: 'announcements'
      }
    ],

    // Default templates used if channel doesn't specify its own
    templates: {
      // Template for a single NFT purchase alert
      saleMessage: 
        `\`\`\`css
        🚨🚨 **BUY ALERT** 🚨🚨
        
        ╔════════════════════════════════════════════════════════════════╗
        ║ Apes on Ape #{tokenId} bought for {price} APE on {marketplace} ║
        ╚════════════════════════════════════════════════════════════════╝
        \`\`\`
        🔗 [View on Magic Eden]({itemUrl})`,
    
      // Template for a single NFT sale alert
      wapeSaleMessage: 
        `\`\`\`css
        🚨🚨 **SALE ALERT** 🚨🚨
        
        ╔═══════════════════════════════════════════════════════════════╗
        ║ Apes on Ape #{tokenId} sold for {price} WAPE on {marketplace} ║
        ╚═══════════════════════════════════════════════════════════════╝
        \`\`\`
        🔗 [View on Magic Eden]({itemUrl})`,
    
      // Template for bulk NFT purchase alert
      bulkSaleMessage: 
        `\`\`\`css
        🚨🚨 **SWEEP ALERT** 🚨🚨
        
        ╔════════════════════════════════════════════════════════════════════════════════════════╗
        ║ {count} Apes on Ape bought for {totalPrice} APE on {marketplace} (avg. {avgPrice} APE) ║
        ╚════════════════════════════════════════════════════════════════════════════════════════╝
        \`\`\`
        🔗 [View on Apescan]({txUrl})`,
    
      // Template for bulk NFT sale alert
      bulkWapeSaleMessage: 
        `\`\`\`css
        🚨🚨 **BULK SALE ALERT** 🚨🚨
        
        ╔════════════════════════════════════════════════════════════════════════════════════════╗
        ║ {count} Apes on Ape sold for {totalPrice} WAPE on {marketplace} (avg. {avgPrice} WAPE) ║
        ╚════════════════════════════════════════════════════════════════════════════════════════╝
        \`\`\`
        🔗 [View on Apescan]({txUrl})`
    }
  },
  twitter: {
    saleMessage: 'Apes on Ape #{tokenId} bought for {price} APE on {marketplace} 🦍\n\n{itemUrl}',
    wapeSaleMessage: 'Apes on Ape #{tokenId} sold for {price} WAPE on {marketplace} 🦍\n\n{itemUrl}',
    bulkSaleMessage: '{count} Apes on Ape bought for {totalPrice} APE on {marketplace} (avg. {avgPrice} APE) 🦍\n\n{txUrl}',
    bulkWapeSaleMessage: '{count} Apes on Ape sold for {totalPrice} WAPE on {marketplace} (avg. {avgPrice} WAPE) 🦍\n\n{txUrl}'
  },

  // Tweet filter configuration
  tweetFilters: {
    enabled: false,  // Disable filtering to allow all tweets
    minBulkPurchaseCount: 1,  // Allow any bulk purchase size
    minSingleSalePrice: {
      ape: "0",    // No minimum price for APE sales
      wape: "0"    // No minimum price for WAPE sales
    },
    skipBulkWapeSales: false,  // Allow bulk WAPE sales
  },
  
  // Enable for detailed logging
  debug_mode: false
}; 