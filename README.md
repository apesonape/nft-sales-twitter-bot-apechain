# Apes on Ape Sales Bot

A Discord and Twitter bot that monitors and announces Apes on Ape NFT sales from Magic Eden. This is a fork of [Crypto-Phunks/nft-sales-twitter-bot](https://github.com/Crypto-Phunks/nft-sales-twitter-bot), modified for the Apes on Ape collection with additional features and customizations.

## Features

- Monitors Magic Eden marketplace for Apes on Ape sales
- Posts sale announcements to Discord with NFT images
- Optional Twitter integration for sale announcements
- Configurable filters for Twitter posts
- Support for both single and bulk sales
- Handles both APE and WAPE sales

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

### Discord Setup
1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot and get your bot token
3. Enable necessary intents (Server Members, Message Content)
4. Invite the bot to your server
5. Add the bot token and channel IDs to your `.env` file

### Twitter Setup (Optional)
1. Create a Twitter Developer account
2. Create a Project and App
3. Generate API keys and access tokens
4. Add the credentials to your `.env` file

## Configuration

The bot is configured through `src/config.ts`. Here are the main configuration options:

### Collection Settings
```typescript
contract_address: '0x...',  // Your NFT contract address
contract_deployment_block: 2767904,  // Block where contract was deployed
collection_name: 'Your Collection',  // Collection name
token_id_offset: 1,  // Offset for token IDs if needed
```

### Message Templates
```typescript
discord: {
  templates: {
    saleMessage: '...',      // Single APE sale template
    wapeSaleMessage: '...',  // Single WAPE sale template
    bulkSaleMessage: '...',  // Bulk APE sale template
    bulkWapeSaleMessage: '...' // Bulk WAPE sale template
  }
}
```

Available template variables:
- `{tokenId}`: NFT token ID
- `{price}`: Sale price
- `{marketplace}`: Marketplace name
- `{itemUrl}`: NFT item URL
- `{count}`: Number of NFTs in bulk sale
- `{totalPrice}`: Total price for bulk sale
- `{avgPrice}`: Average price per NFT in bulk sale
- `{txUrl}`: Transaction URL

### Tweet Filters
```typescript
tweetFilters: {
  enabled: true,  // Enable/disable filtering
  minBulkPurchaseCount: 2,  // Minimum NFTs for bulk sale tweets
  minSingleSalePrice: {
    ape: "100",   // Minimum price for single APE sales
    wape: "100"   // Minimum price for single WAPE sales
  },
  skipBulkWapeSales: true,  // Skip tweeting bulk WAPE sales
}
```

## Development

Run the bot locally:
```bash
npm run dev
```

## Deployment

### Using Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure as a Docker service
5. Add your environment variables in Render's dashboard
6. Deploy!

### Environment Variables

Required:
- `RPC_URL`: Apechain RPC URL
- `MAGIC_EDEN_MARKETPLACE_ADDRESS`: Magic Eden's marketplace contract address
- `DISCORD_TOKEN`: Your Discord bot token
- `DISCORD_CHANNEL_ID`: Main channel ID for announcements
- `DISCORD_ANNOUNCEMENTS_ID`: Secondary channel ID for announcements

Optional (Twitter):
- `TWITTER_API_KEY`: Twitter API key
- `TWITTER_API_SECRET`: Twitter API secret
- `TWITTER_ACCESS_TOKEN`: Twitter access token
- `TWITTER_ACCESS_SECRET`: Twitter access token secret

## License

This project is licensed under the Creative Commons Zero v1.0 Universal License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original project: [Crypto-Phunks/nft-sales-twitter-bot](https://github.com/Crypto-Phunks/nft-sales-twitter-bot) 