// Simple script to run our Telegram bot
const { execSync } = require('child_process');

try {
  console.log('🤖 Starting Copperx Payout Telegram Bot...');
  console.log('Bot token: 7390840940:AAFV1hAeh5LZTadeVbhCRlbRUx2pW1cSVoU');
  console.log('Press Ctrl+C to stop the bot.');
  
  // Run the bot using tsx
  execSync('npx tsx telegram-bot.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Bot execution failed:', error.message);
}