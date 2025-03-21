import 'dotenv/config';
import { startBot } from './server/bot';

/**
 * Main entry point for running the Telegram bot standalone
 */
async function main() {
  console.log('Starting Copperx Telegram Bot...');
  
  try {
    await startBot();
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Run the main function
main();