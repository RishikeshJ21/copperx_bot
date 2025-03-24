// Simple script to run our Telegram bot
const { execSync } = require('child_process');

try {
  console.log('🤖 Starting Copperx Payout Telegram Bot...');
  console.log('Make sure your TELEGRAM_BOT_TOKEN is set in environment variables');
  console.log('Press Ctrl+C to stop the bot.');
  
  // Run the bot using tsx
  execSync('npx tsx start-bot.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Bot execution failed:', error.message);
}