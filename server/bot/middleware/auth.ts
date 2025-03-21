import { Context, Middleware } from 'telegraf';
import { createLoginButtons } from '../utils/markup';
import { config } from '../config';

/**
 * Middleware to check if user's session is authenticated and token is valid
 */
export const requireAuth: Middleware<Context> = async (ctx, next) => {
  // Check if session exists
  if (!ctx.session) {
    await ctx.reply('Please restart the bot by clicking /start.');
    return;
  }
  
  // Check if user is authenticated
  if (!ctx.session.auth || !ctx.session.auth.accessToken) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nYou need to log in to use this feature.\n\nPlease click the button below or use the /login command to authenticate.',
      {
        parse_mode: 'Markdown',
        ...createLoginButtons()
      }
    );
    return;
  }
  
  // Check if token is expired
  const expireAt = ctx.session.auth.expireAt;
  if (expireAt && new Date(expireAt).getTime() < Date.now()) {
    // Clear auth data
    ctx.session.auth = undefined;
    
    await ctx.reply(
      '⚠️ *Session Expired*\n\nYour login session has expired.\n\nPlease log in again to continue.',
      {
        parse_mode: 'Markdown',
        ...createLoginButtons()
      }
    );
    return;
  }
  
  // Authentication is valid, proceed to next middleware
  await next();
};