import { Telegraf } from 'telegraf';
import { CopperxContext } from '../models';
import { registerStartCommand } from './start';
import { registerLoginCommand } from './login';
import { registerHelpCommand } from './help';
import { registerBalanceCommand } from './balance';
import { registerWalletsCommand } from './wallets';
import { registerSendCommand } from './send';
import { registerWithdrawCommand } from './withdraw';
import { registerDepositCommand } from './deposit';
import { registerHistoryCommand } from './history';
import { registerKycCommand } from './kyc';
import { registerProfileCommand } from './profile';
import { showMainMenu } from './menu';

/**
 * Registers all available commands with the bot
 * @param bot Telegraf bot instance
 */
export function registerCommands(bot: Telegraf<CopperxContext>) {
  // Register bot commands
  registerStartCommand(bot);
  registerLoginCommand(bot);
  registerHelpCommand(bot);
  registerBalanceCommand(bot);
  registerWalletsCommand(bot);
  registerSendCommand(bot);
  registerWithdrawCommand(bot);
  registerDepositCommand(bot);
  registerHistoryCommand(bot);
  registerKycCommand(bot);
  registerProfileCommand(bot);
  
  // Register global action handlers
  bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery('Returning to main menu');
    await showMainMenu(ctx);
  });
  
  // Set up bot command list
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'login', description: 'Login to your account' },
    { command: 'balance', description: 'Check your balance' },
    { command: 'send', description: 'Send funds' },
    { command: 'withdraw', description: 'Withdraw funds' },
    { command: 'deposit', description: 'Get deposit address' },
    { command: 'history', description: 'View transaction history' },
    { command: 'wallets', description: 'Manage your wallets' },
    { command: 'kyc', description: 'Verify your identity' },
    { command: 'profile', description: 'View your profile' },
    { command: 'help', description: 'Show help message' }
  ]);
  
  // Add generic error handler
  bot.catch((err: any, ctx: CopperxContext) => {
    console.error('Bot error:', err);
    ctx.reply(
      '❌ Something went wrong. Please try again or use /start to restart the bot.'
    );
  });
}