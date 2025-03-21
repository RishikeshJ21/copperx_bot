import { Telegraf, Markup } from 'telegraf';

export function registerHelpCommand(bot: Telegraf) {
  // Handle /help command
  bot.command('help', async (ctx) => {
    await handleHelpCommand(ctx);
  });
  
  // Also handle the keyboard button
  bot.hears('❓ Help', async (ctx) => {
    await handleHelpCommand(ctx);
  });
  
  // Handle help categories
  bot.action('help_general', async (ctx) => {
    await ctx.answerCbQuery();
    await showGeneralHelp(ctx);
  });
  
  bot.action('help_wallets', async (ctx) => {
    await ctx.answerCbQuery();
    await showWalletsHelp(ctx);
  });
  
  bot.action('help_transfers', async (ctx) => {
    await ctx.answerCbQuery();
    await showTransfersHelp(ctx);
  });
  
  bot.action('help_commands', async (ctx) => {
    await ctx.answerCbQuery();
    await showCommandsHelp(ctx);
  });
  
  bot.action('help_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await handleHelpCommand(ctx);
  });
}

async function handleHelpCommand(ctx: any) {
  await ctx.reply(
    '❓ *Copperx Payout Bot Help*\n\nWelcome to the help section! Select a topic below to learn more:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('General Information', 'help_general')],
        [Markup.button.callback('Wallet Management', 'help_wallets')],
        [Markup.button.callback('Transfers & Withdrawals', 'help_transfers')],
        [Markup.button.callback('Available Commands', 'help_commands')],
        [Markup.button.url('Contact Support', 'https://t.me/copperxcommunity/2183')]
      ])
    }
  );
}

async function showGeneralHelp(ctx: any) {
  await ctx.reply(
    '📋 *General Information*\n\n' +
    'The Copperx Payout Bot allows you to:\n' +
    '• Manage your stablecoin finances via Telegram\n' +
    '• Check balances across different networks\n' +
    '• Send funds to email addresses or wallet addresses\n' +
    '• Withdraw to external wallets or bank accounts\n' +
    '• Receive real-time deposit notifications\n\n' +
    '*Getting Started:*\n' +
    '1. Use /login to authenticate with your Copperx account\n' +
    '2. Check your KYC status with /kyc\n' +
    '3. View your wallet balances with /balance\n' +
    '4. Use the keyboard menu for quick access to features',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Back to Help Menu', 'help_menu')]
      ])
    }
  );
}

async function showWalletsHelp(ctx: any) {
  await ctx.reply(
    '👛 *Wallet Management*\n\n' +
    '*Checking Balances:*\n' +
    '• Use /balance to view your wallet balances across all networks\n' +
    '• Use /wallets to manage your wallets and set a default wallet\n\n' +
    '*Depositing Funds:*\n' +
    '• Use /deposit to get deposit addresses for different networks\n' +
    '• You can copy the address or generate a QR code\n' +
    '• Only send USDC on the selected network\n' +
    '• You\'ll receive a notification when your deposit is confirmed\n\n' +
    '*Minimum Deposits:*\n' +
    '• Minimum deposit amount is 10 USDC\n' +
    '• Deposits typically confirm within 5-10 minutes',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Back to Help Menu', 'help_menu')]
      ])
    }
  );
}

async function showTransfersHelp(ctx: any) {
  await ctx.reply(
    '💸 *Transfers & Withdrawals*\n\n' +
    '*Sending Funds:*\n' +
    '• Use /send to send funds to email addresses or wallet addresses\n' +
    '• Minimum send amount is 1 USDC\n' +
    '• Transaction fees will be shown before confirmation\n\n' +
    '*Withdrawals:*\n' +
    '• Use /withdraw to withdraw funds to external wallets or bank accounts\n' +
    '• Minimum withdrawal to wallet is 10 USDC\n' +
    '• Minimum bank withdrawal is 100 USDC\n' +
    '• Bank withdrawals may take 1-3 business days to process\n\n' +
    '*Transaction History:*\n' +
    '• Use /history to view your transaction history\n' +
    '• You can filter by transaction type and paginate through results',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Back to Help Menu', 'help_menu')]
      ])
    }
  );
}

async function showCommandsHelp(ctx: any) {
  await ctx.reply(
    '🤖 *Available Commands*\n\n' +
    '/start - Initialize the bot and see welcome message\n' +
    '/login - Authenticate with your Copperx account\n' +
    '/balance - View your wallet balances\n' +
    '/wallets - Manage your wallets and set defaults\n' +
    '/send - Send funds to email or wallet address\n' +
    '/withdraw - Withdraw to external wallet or bank\n' +
    '/deposit - Get deposit addresses and instructions\n' +
    '/history - View your transaction history\n' +
    '/kyc - Check your KYC verification status\n' +
    '/profile - View your account profile\n' +
    '/help - Show this help message\n\n' +
    'You can also use the keyboard menu at the bottom of the chat for quick access to these commands.',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Back to Help Menu', 'help_menu')]
      ])
    }
  );
}
