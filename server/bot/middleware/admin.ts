import { MiddlewareFn } from 'telegraf';
import { CopperxContext } from '../models';
import { config } from '../config';

/**
 * Check if the user is an admin of the bot
 * @param ctx Telegram context
 * @returns True if the user is an admin
 */
export function isAdmin(ctx: CopperxContext): boolean {
  // Get the Telegram ID of the user
  const telegramId = ctx.from?.id;
  
  // If no ID is available, user is not an admin
  if (!telegramId) return false;
  
  // Check against the admin ID in the config
  return telegramId.toString() === config.bot.admin.telegramId.toString();
}

/**
 * Middleware to require administrator privileges
 * Blocks non-admin users from accessing protected commands/features
 */
export const requireAdmin: MiddlewareFn<CopperxContext> = async (ctx, next) => {
  if (isAdmin(ctx)) {
    return next();
  }
  
  await ctx.reply('❌ This command is only available to bot administrators.');
  return;
};

/**
 * Middleware to add isAdmin flag to context
 * Use this to conditionally show admin features in responses
 */
export const withAdminFlag: MiddlewareFn<CopperxContext> = async (ctx, next) => {
  ctx.state.isAdmin = isAdmin(ctx);
  return next();
};