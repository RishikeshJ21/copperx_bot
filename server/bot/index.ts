import { Telegraf } from 'telegraf';
import { setupMiddleware } from './middleware/session';
import { requireAuth } from './middleware/auth';
import { registerCommands } from './commands';
import { setupPusherNotifications } from './api/notification';
import { config } from './config';

/**
 * Initializes and configures the Telegram bot
 * @returns Configured Telegraf instance
 */
export function initializeBot(): Telegraf {
  // Create a new Telegraf instance with the bot token
  const bot = new Telegraf(config.bot.token);
  
  // Set up session middleware
  bot.use(setupMiddleware());
  
  // Register all command handlers
  registerCommands(bot);
  
  // Set up Pusher notifications
  setupPusherNotifications(bot);

  return bot;
}

/**
 * Starts the bot with appropriate configuration
 */
export async function startBot() {
  try {
    const bot = initializeBot();
    
    // Launch the bot
    if (config.bot.webhookDomain) {
      // Webhook mode for production
      const webhookUrl = `${config.bot.webhookDomain}${config.bot.webhookPath}`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Bot webhook set to ${webhookUrl}`);
      
      // Return the bot instance for web server to use
      return bot;
    } else {
      // Long polling mode for development
      await bot.launch();
      console.log('Bot started in long polling mode');
      
      // Enable graceful stop
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
      
      return bot;
    }
  } catch (error) {
    console.error('Failed to start the bot:', error);
    throw error;
  }
}