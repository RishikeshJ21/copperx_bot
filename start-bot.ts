import dotenv from 'dotenv';
import { startBot } from './server/bot';
import { config } from './server/bot/config';

// Load environment variables
dotenv.config();

async function main() {
  try {
    if (!config.bot.token) {
      console.error("ERROR: No Telegram bot token provided.");
      console.error("Please provide your bot token by setting TELEGRAM_BOT_TOKEN in your .env file");
      process.exit(1);
    }
    
    console.log("Starting Copperx Payout Telegram Bot...");
    await startBot();
    console.log("Bot started successfully in long polling mode!");
    console.log("Press Ctrl+C to stop the bot");
  } catch (error) {
    console.error("Failed to start the bot:", error);
    process.exit(1);
  }
}

main();