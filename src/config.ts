export const config = {
  contract_address: '0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0',
  contract_deployment_block: 7832296,
  collection_name: 'Apechain',
  token_id_offset: 1,
  use_local_images: false,
  image_api_url: 'APECHAIN_METADATA_BASE_URL',
  
  marketplaces: {
    magiceden: {
      name: 'Magic Eden',
      addresses: [
        '0x0000000000000068F116a894984e2DB1123eB395',
        '0x1d3a594EAf472ca2ceC2A8aE44478c06d6A37E22',
        '0x224ecB4Eae96d31372D1090c3B0233C8310dBbaB'
      ],
      icon: './platform_images/magiceden.png',
      item_url: 'https://magiceden.io/item-details/apechain/{contract}/{tokenId}'
    }
  },

  explorer: {
    tx_url: 'https://apescan.io/tx/{txHash}'
  },

  traits: {
    enabled: true,
    maxTraits: 25,
    excludeTraitTypes: ['Background'],
    sortBy: ['Fur', 'Mouth', 'Eyes', 'Clothes', 'Head'],
    discord: {
      format: '{trait_type}: {value}',
      separator: '\n',
      placement: '{traits}',
      maxTraits: 25
    },
    twitter: {
      format: '• {trait_type}: {value}',
      separator: '\n',
      placement: '\n{traits}',
      maxTraits: 15,
      maxCharacters: 170
    }
  },

  discord: {
    channels: [
      {
        id: process.env.DISCORD_CHANNEL_ID,
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
    saleMessage: '🔵🦍 Apes on Ape #{tokenId} bought for {price} APE on {marketplace} 🛒✨\n\n{traits}\n\n🔗 {itemUrl}',
    wapeSaleMessage: '🔵🦍 Apes on Ape #{tokenId} sold for {price} WAPE on {marketplace} 💰✨\n\n{traits}\n\n🔗 {itemUrl}',
    bulkSaleMessage: '🔵🦍 {count} Apes on Ape bought for {totalPrice} APE on {marketplace} (avg. {avgPrice} APE) 📦💎\n\n🔗 {txUrl}',
    bulkWapeSaleMessage: '🔵🦍 {count} Apes on Ape sold for {totalPrice} WAPE on {marketplace} (avg. {avgPrice} WAPE) 📦💰\n\n🔗 {txUrl}'
  },

  tweetFilters: {
    enabled: false,
    minBulkPurchaseCount: 1,
    minSingleSalePrice: {
      ape: "0",
      wape: "0"
    },
    skipBulkWapeSales: false,
  },
  
  debug_mode: false
}; 