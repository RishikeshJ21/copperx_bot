// Enhanced script to run our Telegram bot in the Replit environment
const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Verify the existence of required files
const requiredFiles = ['start-bot.ts', 'server/bot/index.ts'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.resolve(file)));

if (missingFiles.length > 0) {
  console.error('❌ Required files are missing:', missingFiles.join(', '));
  process.exit(1);
}

// Check environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  console.error('Make sure you have set the bot token in your environment or .env file');
  process.exit(1);
}

console.log('🚀 Starting Copperx Payout Telegram Bot...');
console.log('✅ TELEGRAM_BOT_TOKEN is set');
console.log('📡 API: ', process.env.COPPERX_API_URL || 'https://income-api.copperx.io');
console.log('⚙️ Environment: ', process.env.NODE_ENV || 'development');
console.log('Press Ctrl+C to stop the bot.');

try {
  // Run the bot using tsx
  console.log('🤖 Launching bot process...');
  const nodeEnv = process.env.NODE_ENV || 'development';
  execSync(`NODE_ENV=${nodeEnv} npx tsx start-bot.ts`, { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: nodeEnv }  
  });
} catch (error) {
  if (error.status === 127) {
    console.error('❌ Command not found. Make sure tsx is installed:');
    console.log('Installing tsx...');
    try {
      execSync('npm install -g tsx', { stdio: 'inherit' });
      console.log('Retrying bot launch...');
      execSync('npx tsx start-bot.ts', { stdio: 'inherit' });
    } catch (installError) {
      console.error('❌ Failed to install tsx:', installError.message);
      process.exit(1);
    }
  } else {
    console.error('❌ Bot execution failed:', error.message);
    process.exit(1);
  }
}