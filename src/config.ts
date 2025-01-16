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

  // Trait display configuration
  traits: {
    enabled: true,  // Set to false to disable trait display
    maxTraits: 25,   // Global default if not specified per platform
    excludeTraitTypes: ['Background'],  // Trait types to exclude from display
    sortBy: [       // Optional: Display traits in this order (if not specified, original order is kept)
      'Fur',
      'Mouth',
      'Eyes',
      'Clothes',
      'Head'
    ],
    discord: {
      format: '{trait_type}: {value}',  // Format for each trait
      separator: '\n',                       // Separator between traits
      placement: '{traits}',                 // Placeholder in discord templates
      maxTraits: 25                          // Discord-specific trait limit
    },
    twitter: {
      format: '{trait_type}: {value}',      // Format for each trait
      separator: ' | ',                      // Separator between traits
      placement: '\n{traits}',               // Placeholder in twitter templates
      maxTraits: 8                          // Twitter-specific trait limit (lower due to character limit)
    }
  },

  // Discord config
  discord: {
    channels: [
      {
        id: process.env.DISCORD_CHANNEL_ID,  // Main channel
        name: 'main'
      },
      {
        id: process.env.DISCORD_ANNOUNCEMENTS_ID,
        name: 'announcements'
      }
    ],
    buyMessage: {
      color: '#0054FA',
      title: '🔥 **BUY ALERT!**',
      description: '🎉 **Apes on Ape #{tokenId}** has been bought for **{price} APE** on **{marketplace}**!\n[View NFT](<{itemUrl}>)',
    },
    saleMessage: {
      color: '#E74C3C',
      title: '🔥 **SALE ALERT!**',
      description: '💸 **Apes on Ape #{tokenId}** has been sold for **{price} WAPE** on **{marketplace}**!\n[View NFT](<{itemUrl}>)',
    },
    bulkBuyMessage: {
      color: '#28A745',
      title: '🔥 **SWEEP ALERT!**',
      description: '🛒 **{count} Apes on Ape NFTs** bought for a total of **{totalPrice} APE**!\n📊 Average price: **{avgPrice} APE** per NFT.\n[View Transaction](<{txUrl}>)',
    },
    bulkSaleMessage: {
      color: '#FFC107',
      title: '🔥 **BULK SALE ALERT!**',
      description: '📤 **{count} Apes on Ape NFTs** sold for a total of **{totalPrice} WAPE**!\n📊 Average price: **{avgPrice} WAPE** per NFT.\n[View Transaction](<{txUrl}>)',
    },
    footerText: 'Apes on Ape Sales Bot (ApeChain)',
  },
  
  twitter: {
    saleMessage: 'Apes on Ape #{tokenId} bought for {price} APE on {marketplace} 🦍 {traits}\n\n{itemUrl}',
    wapeSaleMessage: 'Apes on Ape #{tokenId} sold for {price} WAPE on {marketplace} 🦍 {traits}\n\n{itemUrl}',
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