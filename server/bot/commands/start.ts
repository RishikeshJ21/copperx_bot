import { Telegraf, Markup } from 'telegraf';
import { createMainMenuButtons } from '../utils/markup';

export function registerStartCommand(bot: Telegraf) {
  bot.command('start', async (ctx) => {
    const firstName = ctx.from.first_name || 'there';
    
    const welcomeMessage = `
*Welcome to Copperx Payout Bot!* 👋

Hi ${firstName}, I'm your personal assistant for managing your stablecoin finances directly through Telegram.

With me, you can:
• Check wallet balances
• Send funds to emails or wallet addresses
• Withdraw to external wallets or bank accounts
• View transaction history
• Check KYC status
• Generate deposit addresses

*To get started*, please use /login to authenticate with your Copperx account.

Need help? Type /help to see all available commands.
`;

    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['💰 Balance', '👛 Wallets'],
        ['📤 Send', '📥 Deposit'],
        ['📋 History', '🔑 Login'],
        ['❓ Help']
      ]).resize()
    });
  });

  // Handle text-based menu buttons
  bot.hears('❓ Help', (ctx) => ctx.command.help());
  bot.hears('🔑 Login', (ctx) => ctx.command.login());
}
