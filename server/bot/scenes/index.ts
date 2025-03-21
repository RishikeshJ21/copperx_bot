import { Scenes, Telegraf } from 'telegraf';
import { CopperxContext } from '../models';
import { SCENE_IDS } from './config';
import { createBalanceScene } from './balance-scene';

/**
 * Initialize and register all scenes (wizards) for the bot
 * @param bot Telegraf bot instance
 * @returns Configured stage with all scenes
 */
export function setupScenes(bot: Telegraf<CopperxContext>): Scenes.Stage<CopperxContext> {
  // Create simple scenes for basic functionality
  const sendScene = new Scenes.BaseScene<CopperxContext>(SCENE_IDS.SEND);
  const depositScene = new Scenes.BaseScene<CopperxContext>(SCENE_IDS.DEPOSIT);
  const withdrawScene = new Scenes.BaseScene<CopperxContext>(SCENE_IDS.WITHDRAW);
  
  // Create the balance scene (more complex functionality)
  const balanceScene = createBalanceScene();
  
  // Configure basic scenes
  setupBasicScenes(sendScene, depositScene, withdrawScene);
  
  // Create a new stage with all scenes
  const stage = new Scenes.Stage<CopperxContext>([
    // Add all scenes
    sendScene,
    depositScene,
    withdrawScene,
    balanceScene
  ]);
  
  // Use scene middleware
  bot.use(stage.middleware());
  
  // Register scene entry points
  registerSceneEntryPoints(bot);
  
  return stage;
}

/**
 * Setup basic scene handlers
 * @param sendScene Send money scene
 * @param depositScene Deposit funds scene
 * @param withdrawScene Withdraw funds scene
 */
function setupBasicScenes(
  sendScene: Scenes.BaseScene<CopperxContext>,
  depositScene: Scenes.BaseScene<CopperxContext>, 
  withdrawScene: Scenes.BaseScene<CopperxContext>
) {
  // Send scene handlers
  sendScene.enter(async (ctx) => {
    await ctx.reply('💸 *Send Funds*\nThis feature is coming soon!', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  });
  
  sendScene.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Returning to main menu');
    return ctx.scene.leave();
  });
  
  // Deposit scene handlers
  depositScene.enter(async (ctx) => {
    await ctx.reply('⬆️ *Deposit Funds*\nThis feature is coming soon!', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  });
  
  depositScene.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Returning to main menu');
    return ctx.scene.leave();
  });
  
  // Withdraw scene handlers
  withdrawScene.enter(async (ctx) => {
    await ctx.reply('⬇️ *Withdraw Funds*\nThis feature is coming soon!', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  });
  
  withdrawScene.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Returning to main menu');
    return ctx.scene.leave();
  });
  
  // Common handlers for all scenes
  [sendScene, depositScene, withdrawScene].forEach(scene => {
    // Handle /cancel command
    scene.command('cancel', (ctx) => {
      ctx.reply('Operation cancelled');
      return ctx.scene.leave();
    });
    
    // Handle unexpected updates
    scene.on('message', (ctx) => {
      return ctx.reply('Please use the buttons to navigate or type /cancel to exit');
    });
  });
}

/**
 * Register command and action handlers that enter scenes
 * @param bot Telegraf bot instance
 */
function registerSceneEntryPoints(bot: Telegraf<CopperxContext>) {
  // Send command entry points
  bot.command('send', (ctx) => ctx.scene.enter(SCENE_IDS.SEND));
  bot.action('send', async (ctx) => {
    await ctx.answerCbQuery('Starting send flow...');
    return ctx.scene.enter(SCENE_IDS.SEND);
  });
  
  // Withdraw command entry points
  bot.command('withdraw', (ctx) => ctx.scene.enter(SCENE_IDS.WITHDRAW));
  bot.action('withdraw', async (ctx) => {
    await ctx.answerCbQuery('Starting withdrawal flow...');
    return ctx.scene.enter(SCENE_IDS.WITHDRAW);
  });
  
  // Deposit command entry points
  bot.command('deposit', (ctx) => ctx.scene.enter(SCENE_IDS.DEPOSIT));
  bot.action('deposit', async (ctx) => {
    await ctx.answerCbQuery('Starting deposit flow...');
    return ctx.scene.enter(SCENE_IDS.DEPOSIT);
  });
  
  // Balance command entry points
  bot.command('balance', (ctx) => ctx.scene.enter(SCENE_IDS.BALANCE));
  bot.action('balance', async (ctx) => {
    await ctx.answerCbQuery('Checking your balances...');
    return ctx.scene.enter(SCENE_IDS.BALANCE);
  });
  
  // Wallet command redirects to balance
  bot.command('wallet', (ctx) => ctx.scene.enter(SCENE_IDS.BALANCE));
  bot.command('wallets', (ctx) => ctx.scene.enter(SCENE_IDS.BALANCE));
  bot.action('wallets', async (ctx) => {
    await ctx.answerCbQuery('Viewing your wallets...');
    return ctx.scene.enter(SCENE_IDS.BALANCE);
  });
}