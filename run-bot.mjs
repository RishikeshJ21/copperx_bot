// Enhanced Bot standalone runner script with proper environment setup
import { exec } from 'child_process';
import 'dotenv/config';

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting Copperx Telegram Bot...');

// Check for bot token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('\x1b[31mError: TELEGRAM_BOT_TOKEN environment variable is required\x1b[0m');
  console.error('Make sure you have set the bot token in your environment or .env file');
  process.exit(1);
}

console.log('\x1b[33m%s\x1b[0m', '👉 Token detected, proceeding with bot initialization');
console.log('\x1b[33m%s\x1b[0m', '📡 Using API Base URL: https://income-api.copperx.io');
console.log('\x1b[32m%s\x1b[0m', '✅ Press Ctrl+C to stop the bot.');

// Run the bot using start-bot.ts which is our standardized entry point
const botProcess = exec('NODE_ENV=development npx tsx start-bot.ts');

// Forward stdout and stderr with enhanced logging
botProcess.stdout.on('data', (data) => {
  // Normal logs
  console.log(data.toString().trim());
});

botProcess.stderr.on('data', (data) => {
  // Error logs in red
  console.error('\x1b[31m%s\x1b[0m', data.toString().trim());
});

// Handle process events
botProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\x1b[32m%s\x1b[0m', '🛑 Bot process exited successfully');
  } else {
    console.error('\x1b[31m%s\x1b[0m', `❌ Bot process exited with code ${code}`);
  }
});

// Clean up on process exit
process.on('SIGINT', () => {
  console.log('\x1b[33m%s\x1b[0m', '🛑 Stopping bot process...');
  botProcess.kill();
  process.exit();
});

// Keep the script running
process.stdin.resume();