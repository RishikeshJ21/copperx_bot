// Simple script to run our Telegram bot
import { exec } from 'child_process';

console.log('🤖 Starting Copperx Payout Telegram Bot...');
console.log('Bot token: 7390840940:AAFV1hAeh5LZTadeVbhCRlbRUx2pW1cSVoU');
console.log('Press Ctrl+C to stop the bot.');

// Run the bot using tsx
const botProcess = exec('npx tsx telegram-bot.ts');

// Forward stdout and stderr
botProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

botProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Handle process events
botProcess.on('close', (code) => {
  console.log(`Bot process exited with code ${code}`);
});

// Keep the script running
process.stdin.resume();