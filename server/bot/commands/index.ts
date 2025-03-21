import { Telegraf } from 'telegraf';
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

/**
 * Registers all available commands with the bot
 * @param bot Telegraf bot instance
 */
export function registerCommands(bot: Telegraf) {
  // Register core commands
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
  
  // Set command list in Telegram
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'login', description: 'Login to your account' },
    { command: 'balance', description: 'Check your balance' },
    { command: 'wallets', description: 'Manage your wallets' },
    { command: 'send', description: 'Send funds' },
    { command: 'withdraw', description: 'Withdraw funds' },
    { command: 'deposit', description: 'Get deposit address' },
    { command: 'history', description: 'View transaction history' },
    { command: 'kyc', description: 'Verify your identity' },
    { command: 'profile', description: 'View your profile' },
    { command: 'help', description: 'Show help' }
  ]).catch(err => {
    console.error('Failed to set commands:', err);
  });
}