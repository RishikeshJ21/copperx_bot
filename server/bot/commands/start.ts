import { Telegraf } from 'telegraf';
import { CopperxContext } from '../models';
import { showMainMenu } from './menu';

/**
 * Register the start command handler
 * @param bot Telegraf bot instance
 */
export function registerStartCommand(bot: Telegraf<CopperxContext>) {
  bot.start(async (ctx) => {
    await showMainMenu(ctx);
  });
}