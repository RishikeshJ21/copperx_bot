// Simple script to run the Telegram bot with better error handling and status reporting
import { execSync } from 'child_process';

console.log('🤖 Starting Copperx Payout Bot...');
console.log('Checking environment...');

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is required');
  console.error('Please set the bot token in your environment or .env file');
  process.exit(1);
}

console.log('✅ TELEGRAM_BOT_TOKEN is set');
console.log('🚀 Launching bot...');

try {
  // Try to run the bot with tsx (TypeScript execution)
  execSync('npx tsx start-bot.ts', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
} catch (error) {
  console.error('❌ Bot execution failed:', error.message);
  process.exit(1);
}
