import { Markup, Telegraf } from 'telegraf';
import { config } from '../config';
import { createLoginButtons, createMainMenuButtons } from '../utils/markup';
import { CopperxContext } from '../models';

/**
 * Register the start command handler
 * @param bot Telegraf bot instance
 */
export function registerStartCommand(bot: Telegraf) {
  // Handler for /start command
  bot.start(async (ctx) => {
    const typedCtx = ctx as any as CopperxContext;
    
    // User already logged in
    if (typedCtx.session?.auth?.accessToken) {
      const firstName = typedCtx.session.auth.user?.firstName || 'there';
      
      await ctx.reply(
        `👋 Welcome back, *${firstName}*!\n\nYou can use the menu below to access Copperx Payout features.`,
        {
          parse_mode: 'Markdown',
          ...createMainMenuButtons()
        }
      );
      return;
    }
    
    // New user, show welcome message
    await ctx.reply(
      config.messages.welcome,
      {
        parse_mode: 'Markdown',
        ...createLoginButtons()
      }
    );
  });
  
  // Handler for main menu action
  bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const typedCtx = ctx as any as CopperxContext;
    
    if (typedCtx.session?.auth?.accessToken) {
      const firstName = typedCtx.session.auth.user?.firstName || 'there';
      
      await ctx.editMessageText(
        `👋 Hello, *${firstName}*!\n\nYou can use the menu below to access Copperx Payout features.`,
        {
          parse_mode: 'Markdown',
          ...createMainMenuButtons()
        }
      );
    } else {
      await ctx.editMessageText(
        config.messages.welcome,
        {
          parse_mode: 'Markdown',
          ...createLoginButtons()
        }
      );
    }
  });
}