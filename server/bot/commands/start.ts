import { Telegraf } from 'telegraf';
import { createLoginButtons } from '../utils/markup';
import { config } from '../config';
import { storage } from '../../storage';
import { CopperxContext } from '../models';

export function registerStartCommand(bot: Telegraf) {
  // Handle /start command
  bot.command('start', async (ctx) => {
    try {
      const telegramId = ctx.from?.id.toString();
      
      if (!telegramId) {
        return;
      }
      
      // Get user from storage
      let user = await storage.getUser(telegramId);
      
      // Create new user if not exists
      if (!user) {
        user = await storage.createUser({
          telegramId,
          firstName: ctx.from?.first_name || null,
          lastName: ctx.from?.last_name || null,
          username: ctx.from?.username || null,
          email: null
        });
      }
      
      // Send welcome message
      await ctx.replyWithMarkdown(
        config.messages.welcome,
        createLoginButtons()
      );
      
      // Reset any ongoing flow states
      if ((ctx as CopperxContext).session) {
        if ((ctx as CopperxContext).session.login) {
          (ctx as CopperxContext).session.login = undefined;
        }
        if ((ctx as CopperxContext).session.send) {
          (ctx as CopperxContext).session.send = undefined;
        }
        if ((ctx as CopperxContext).session.withdraw) {
          (ctx as CopperxContext).session.withdraw = undefined;
        }
        
        // Save the session
        await (ctx as CopperxContext).saveSession();
      }
    } catch (error) {
      console.error('Error in start command:', error);
      await ctx.reply('Sorry, there was an error starting the bot. Please try again.');
    }
  });
}