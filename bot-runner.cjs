// Enhanced script to run our Telegram bot in the Replit environment
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

// Bot status tracking
let botStatus = 'initializing';
let botStartTime = null;
let lastError = null;
let botRestartsCount = 0;
let botProcess = null;

// Simple status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    mode: 'replit',
    service: 'Copperx Telegram Bot',
    botStatus,
    uptime: botStartTime ? Math.floor((Date.now() - botStartTime) / 1000) : 0,
    time: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    botStatus,
    botRestarts: botRestartsCount,
    timestamp: new Date().toISOString(),
    lastError: lastError ? {
      message: lastError.message,
      time: lastError.time
    } : null
  });
});

// Start server on port 5000 (default Replit port)
const port = process.env.PORT || 5000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[Replit] Server started on port ${port}`);
  console.log('[Replit] Starting Telegram bot in the background...');
});

// Function to start the bot process
function startBotProcess() {
  // Check if token is available
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    lastError = { 
      message: 'TELEGRAM_BOT_TOKEN environment variable is not set', 
      time: new Date().toISOString() 
    };
    console.error('[Replit] Error:', lastError.message);
    botStatus = 'error';
    return;
  }

  // Check if start-bot.ts exists
  const startBotPath = path.join(process.cwd(), 'start-bot.ts');
  if (!fs.existsSync(startBotPath)) {
    lastError = { 
      message: 'start-bot.ts file not found', 
      time: new Date().toISOString() 
    };
    console.error('[Replit] Error:', lastError.message);
    botStatus = 'error';
    return;
  }

  // If there's an existing process, kill it
  if (botProcess) {
    try {
      botProcess.kill();
    } catch (err) {
      console.log('[Replit] Error killing previous bot process:', err.message);
    }
  }

  // Launch bot process
  const env = { 
    ...process.env, 
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  botStatus = 'starting';
  botProcess = spawn('npx', ['tsx', 'start-bot.ts'], { 
    env, 
    stdio: 'inherit',
  });
  
  botStartTime = Date.now();
  
  botProcess.on('error', (err) => {
    lastError = { message: err.message, time: new Date().toISOString() };
    console.error('[Replit] Failed to start Telegram bot process:', err);
    botStatus = 'error';
  });
  
  botProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      lastError = { 
        message: `Bot exited with code ${code}, signal: ${signal}`, 
        time: new Date().toISOString() 
      };
      console.error(`[Replit] Bot process exited with code ${code}, signal: ${signal}`);
      botStatus = 'crashed';
      
      // Attempt to restart if not shutting down
      if (server.listening) {
        console.log('[Replit] Attempting to restart bot in 5 seconds...');
        botRestartsCount++;
        setTimeout(startBotProcess, 5000);
      }
    }
  });
  
  console.log('[Replit] Bot process started!');
  botStatus = 'running';
}

// Start the bot after a short delay to ensure the server is ready
setTimeout(startBotProcess, 2000);

// Handle shutdown
process.on('SIGINT', () => {
  console.log('[Replit] Shutting down...');
  botStatus = 'stopping';
  if (botProcess) {
    botProcess.kill();
  }
  server.close();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('[Replit] Terminating...');
  botStatus = 'stopping';
  if (botProcess) {
    botProcess.kill();
  }
  server.close();
  process.exit();
});