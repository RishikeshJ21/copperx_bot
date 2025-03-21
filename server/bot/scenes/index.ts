import { Scenes, Telegraf } from 'telegraf';
import { CopperxContext } from '../models';
import { registerSendScene } from './send-scene';
import { registerDepositScene } from './deposit-scene';
import { registerWithdrawScene } from './withdraw-scene';

/**
 * Initialize and register all scenes (wizards) for the bot
 * @param bot Telegraf bot instance
 * @returns Configured stage with all scenes
 */
export function setupScenes(bot: Telegraf): Scenes.Stage<CopperxContext> {
  // Create a new stage with all scenes
  const stage = new Scenes.Stage<CopperxContext>([
    // Register all scenes here
    ...registerSendScene(),
    ...registerDepositScene(),
    ...registerWithdrawScene(),
  ]);

  // Use scene middleware
  bot.use(stage.middleware());

  // Register scene entry points
  registerSceneEntryPoints(bot);

  return stage;
}

/**
 * Register command and action handlers that enter scenes
 * @param bot Telegraf bot instance
 */
function registerSceneEntryPoints(bot: Telegraf) {
  // Send command entry points
  bot.command('send', (ctx: CopperxContext) => ctx.scene.enter('send_scene'));
  bot.action('send', (ctx: CopperxContext) => {
    ctx.answerCbQuery('Starting send flow...');
    return ctx.scene.enter('send_scene');
  });
  
  // Withdraw command entry points
  bot.command('withdraw', (ctx: CopperxContext) => ctx.scene.enter('withdraw_scene'));
  bot.action('withdraw', (ctx: CopperxContext) => {
    ctx.answerCbQuery('Starting withdrawal flow...');
    return ctx.scene.enter('withdraw_scene');
  });
  
  // Deposit command entry points
  bot.command('deposit', (ctx: CopperxContext) => ctx.scene.enter('deposit_scene'));
  bot.action('deposit', (ctx: CopperxContext) => {
    ctx.answerCbQuery('Starting deposit flow...');
    return ctx.scene.enter('deposit_scene');
  });
}