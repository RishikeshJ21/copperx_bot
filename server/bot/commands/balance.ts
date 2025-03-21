import { Markup, Telegraf } from 'telegraf';
import { CopperxContext } from '../models';
import { SCENE_IDS } from '../scenes/config';
import { showMainMenu } from './menu';

/**
 * Register balance command handlers
 * @param bot Telegraf bot instance
 */
export function registerBalanceCommand(bot: Telegraf<CopperxContext>) {
  // Register balance/wallet commands to enter the balance scene
  bot.command(['balance', 'balances', 'wallet', 'wallets'], async (ctx) => {
    await ctx.scene.enter(SCENE_IDS.BALANCE);
  });
  
  bot.action('balance', async (ctx) => {
    await ctx.answerCbQuery('Fetching balances...');
    await ctx.scene.enter(SCENE_IDS.BALANCE);
  });
  
  bot.action('wallets', async (ctx) => {
    await ctx.answerCbQuery('Viewing your wallets...');
    await ctx.scene.enter(SCENE_IDS.BALANCE);
  });
  
  // Handle main menu action
  bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery('Returning to main menu');
    await showMainMenu(ctx);
  });
}