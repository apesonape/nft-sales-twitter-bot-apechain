import { TwitterService } from './services/twitter.service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const twitterService = new TwitterService();
  
  // If PIN is provided as argument, generate access token
  if (process.argv[4]) {
    const oauthToken = process.argv[2];
    const oauthTokenSecret = process.argv[3];
    const pin = process.argv[4];
    await twitterService.generateAccessToken(oauthToken, oauthTokenSecret, pin);
  } else {
    // Otherwise generate auth URL
    await twitterService.generateAuthUrl();
    console.log('\nOnce you have the PIN, run this command again with the OAuth tokens and PIN:');
    console.log('npx ts-node src/generate-auth.ts <oauth_token> <oauth_token_secret> <pin>');
  }
}

main().catch(console.error); 