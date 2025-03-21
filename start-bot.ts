// Simple script to start the Telegram bot
import { spawn } from 'child_process';
import * as path from 'path';

console.log('🤖 Starting Copperx Payout Telegram Bot...');

// Run the bot using tsx (TypeScript executor)
const botProcess = spawn('npx', ['tsx', 'telegram-bot.ts'], {
  stdio: 'inherit',
  shell: true
});

// Handle process events
botProcess.on('error', (error) => {
  console.error('Failed to start bot process:', error);
});

process.on('SIGINT', () => {
  console.log('Stopping bot...');
  botProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping bot...');
  botProcess.kill('SIGTERM');
  process.exit(0);
});