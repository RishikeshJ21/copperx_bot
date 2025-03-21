import { Markup, Telegraf } from 'telegraf';
import { config } from '../config';
import { CopperxContext } from '../models';

/**
 * Register help command handlers
 * @param bot Telegraf bot instance
 */
export function registerHelpCommand(bot: Telegraf) {
  // Command handler for /help
  bot.command('help', async (ctx) => {
    await handleHelpCommand(ctx as any);
  });
  
  // Help button handler
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await handleHelpCommand(ctx as any);
  });
  
  // Topic-specific help handlers
  bot.action('help_wallets', async (ctx) => {
    await ctx.answerCbQuery();
    await showWalletsHelp(ctx as any);
  });
  
  bot.action('help_transfers', async (ctx) => {
    await ctx.answerCbQuery();
    await showTransfersHelp(ctx as any);
  });
  
  bot.action('help_commands', async (ctx) => {
    await ctx.answerCbQuery();
    await showCommandsHelp(ctx as any);
  });
}

/**
 * Handle the help command
 * @param ctx Telegram context
 */
async function handleHelpCommand(ctx: CopperxContext) {
  // Check if this is a callback action or new command
  const isAction = 'callback_query' in ctx.update;
  
  const helpMessage = `📚 *Help Center*\n\nWelcome to the Copperx Payout bot help center! Choose a topic below to learn more:`;
  
  const helpKeyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('💼 Wallets', 'help_wallets'),
      Markup.button.callback('💸 Transfers', 'help_transfers')
    ],
    [
      Markup.button.callback('🤖 Commands', 'help_commands'),
      Markup.button.callback('❓ Support', 'help_support')
    ],
    [Markup.button.callback('🏠 Main Menu', 'main_menu')]
  ]);
  
  // Either edit existing message or send new one
  if (isAction) {
    await ctx.editMessageText(helpMessage, {
      parse_mode: 'Markdown',
      ...helpKeyboard
    });
  } else {
    await ctx.reply(helpMessage, {
      parse_mode: 'Markdown',
      ...helpKeyboard
    });
  }
}

/**
 * Show wallet-related help
 * @param ctx Telegram context
 */
async function showWalletsHelp(ctx: CopperxContext) {
  const message = `💼 *Wallet Help*\n\n• View your balances with /balance\n• Manage your wallets with /wallets\n• Set a default wallet for faster transactions\n• Each network has its own wallet address\n• Deposit using /deposit command\n\nFor more detailed instructions, visit our help center at copperx.io/help`;
  
  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Help', 'help')]
    ])
  });
}

/**
 * Show transfer-related help
 * @param ctx Telegram context
 */
async function showTransfersHelp(ctx: CopperxContext) {
  const message = `💸 *Transfers Help*\n\n• Send funds via email with /send\n• Withdraw to external wallets with /withdraw\n• View your transaction history with /history\n• Filter transactions by type\n• Minimum transaction amount: ${config.limits.minSend} USDC\n\nFor more detailed instructions, visit our help center at copperx.io/help`;
  
  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Help', 'help')]
    ])
  });
}

/**
 * Show commands help
 * @param ctx Telegram context
 */
async function showCommandsHelp(ctx: CopperxContext) {
  const message = config.messages.help.main;
  
  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Help', 'help')]
    ])
  });
}