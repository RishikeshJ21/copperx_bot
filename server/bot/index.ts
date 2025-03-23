import { Telegraf, Scenes, session } from 'telegraf';
import { registerCommands } from './commands';
import { setupMiddleware } from './middleware/session';
import { setupPusherNotifications } from './api/notification';
import { config } from './config';
import { CopperxContext } from './models';
import { setupScenes } from './scenes';

// Singleton bot instance
let botInstance: Telegraf<CopperxContext> | null = null;

/**
 * Initializes and configures the Telegram bot
 * @returns Configured Telegraf instance
 */
export function initializeBot(): Telegraf<CopperxContext> {
  // If bot instance already exists, return it
  if (botInstance) {
    return botInstance;
  }
  
  // Get bot token from environment variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('No Telegram bot token provided. Please set TELEGRAM_BOT_TOKEN in your environment variables.');
    process.exit(1);
  }
  
  // Create bot instance
  botInstance = new Telegraf<CopperxContext>(botToken);
  
  // Set up session middleware
  botInstance.use(setupMiddleware());
  
  // Set up built-in session middleware for scene management
  botInstance.use(session());
  
  // Initialize and set up scenes
  setupScenes(botInstance);
  
  // Register all commands
  registerCommands(botInstance);
  
  // Set up Pusher notifications
  setupPusherNotifications(botInstance).catch(error => {
    console.error('Failed to set up Pusher notifications:', error);
  });
  
  // Enable graceful stop
  process.once('SIGINT', () => botInstance?.stop('SIGINT'));
  process.once('SIGTERM', () => botInstance?.stop('SIGTERM'));
  
  return botInstance;
}

/**
 * Starts the bot with appropriate configuration
 */
export async function startBot() {
  try {
    const bot = initializeBot();
    
    // Set up webhooks if in production environment, otherwise use long polling
    if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_DOMAIN) {
      const webhookDomain = process.env.WEBHOOK_DOMAIN;
      const webhookPath = process.env.WEBHOOK_PATH || '/webhook';
      
      await bot.telegram.setWebhook(`${webhookDomain}${webhookPath}`);
      console.log(`Webhook set: ${webhookDomain}${webhookPath}`);
    } else {
      // Use long polling - try-catch to prevent duplicate launches
      try {
        await bot.launch();
        console.log('Bot started in long polling mode');
      } catch (error) {
        // If error is about duplicate polling, just log it
        if (error instanceof Error && error.message.includes('Conflict: terminated by other getUpdates request')) {
          console.log('Bot is already polling, skipping launch');
        } else {
          // Otherwise, re-throw the error
          throw error;
        }
      }
    }
    
    console.log(`${config.bot.name} is running`);
    return bot;
  } catch (error) {
    console.error('Failed to start bot:', error);
    throw error;
  }
}