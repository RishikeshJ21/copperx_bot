// Bot runner script for Replit environment
import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🚀 Starting Copperx Telegram Bot...');

// Check for bot token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  console.error('Make sure you have set the bot token in your environment or .env file');
  process.exit(1);
}

console.log('✅ Token detected, proceeding with bot initialization');
console.log('📡 API Base URL:', process.env.COPPERX_API_URL || 'https://income-api.copperx.io');

try {
  // Run the bot using tsx (TypeScript execution engine)
  console.log('🤖 Launching bot process...');
  execSync('npx tsx start-bot.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start bot:', error.message);
  process.exit(1);
}