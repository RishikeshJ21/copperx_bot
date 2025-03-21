import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { setupMiddleware } from './middleware/session';
import { requireAuth } from './middleware/auth';
import { config } from './config';
import { log } from '../vite';

export async function initializeBot() {
  // Initialize the bot with the token from environment variables
  const bot = new Telegraf(config.telegramToken);
  
  // Configure global error handling
  bot.catch((err, ctx) => {
    log(`Telegram bot error: ${err.message} for ${ctx.updateType}`);
    
    // Attempt to notify user about the error
    if (ctx.chat) {
      ctx.reply('Sorry, an error occurred while processing your request. Please try again later.')
        .catch(e => log(`Failed to send error message: ${e.message}`));
    }
    
    console.error('Bot error details:', err);
  });
  
  // Set up session middleware
  bot.use(session());
  bot.use(setupMiddleware());
  
  // Log all incoming messages (for debugging)
  if (config.debug) {
    bot.on(message('text'), (ctx, next) => {
      const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.id;
      log(`Message from ${username}: ${ctx.message.text}`);
      return next();
    });
  }
  
  return bot;
}
