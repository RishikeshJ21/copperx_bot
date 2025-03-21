import { Telegraf, Scenes, session } from 'telegraf';
import { registerCommands } from './commands';
import { setupMiddleware } from './middleware/session';
import { setupPusherNotifications } from './api/notification';
import { config } from './config';
import { CopperxContext } from './models';
import { setupScenes } from './scenes';

/**
 * Initializes and configures the Telegram bot
 * @returns Configured Telegraf instance
 */
export function initializeBot(): Telegraf<CopperxContext> {
  // Get bot token from environment variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('No Telegram bot token provided. Please set TELEGRAM_BOT_TOKEN in your environment variables.');
    process.exit(1);
  }
  
  // Create bot instance
  const bot = new Telegraf<CopperxContext>(botToken);
  
  // Set up session middleware
  bot.use(setupMiddleware());
  
  // Set up built-in session middleware for scene management
  bot.use(session());
  
  // Initialize and set up scenes
  setupScenes(bot);
  
  // Register all commands
  registerCommands(bot);
  
  // Set up webhooks if in production environment, otherwise use long polling
  if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_DOMAIN) {
    const webhookDomain = process.env.WEBHOOK_DOMAIN;
    const webhookPath = process.env.WEBHOOK_PATH || '/webhook';
    
    bot.telegram.setWebhook(`${webhookDomain}${webhookPath}`);
    console.log(`Webhook set: ${webhookDomain}${webhookPath}`);
  } else {
    // Use long polling
    bot.launch().then(() => {
      console.log('Bot started in long polling mode');
    });
  }
  
  // Set up Pusher notifications
  setupPusherNotifications(bot).catch(error => {
    console.error('Failed to set up Pusher notifications:', error);
  });
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  
  return bot;
}

/**
 * Starts the bot with appropriate configuration
 */
export async function startBot() {
  try {
    const bot = initializeBot();
    console.log(`${config.bot.name} is running`);
    return bot;
  } catch (error) {
    console.error('Failed to start bot:', error);
    throw error;
  }
}