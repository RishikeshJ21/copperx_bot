import { Telegraf, Markup } from 'telegraf';
import { getWalletBalances } from '../api/wallet';
import { formatCurrency } from '../utils/format';

export function registerBalanceCommand(bot: Telegraf) {
  // Handle /balance command
  bot.command('balance', async (ctx) => {
    await handleBalanceCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('💰 Balance', async (ctx) => {
    await handleBalanceCommand(ctx);
  });
  
  // Handle refresh balance action
  bot.action('refresh_balance', async (ctx) => {
    await ctx.answerCbQuery('Refreshing balances...');
    await handleBalanceCommand(ctx, true);
  });
}

async function handleBalanceCommand(ctx: any, isRefresh = false) {
  try {
    // Show loading message for better UX
    const loadingMessage = await ctx.reply('Fetching your wallet balances...');
    
    // Get wallet balances from API
    const balances = await getWalletBalances(ctx.session.auth.accessToken);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMessage.message_id);
    
    if (!balances || balances.length === 0) {
      await ctx.reply(
        '🔍 *No wallets found*\n\nYou don\'t have any wallets with balances yet. Visit the Copperx web platform to set up your wallet.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('Go to Copperx', 'https://payout.copperx.io')]
          ])
        }
      );
      return;
    }
    
    // Calculate total balance across all wallets
    const totalBalance = balances.reduce((sum, wallet) => {
      return sum + parseFloat(wallet.balance || '0');
    }, 0);
    
    // Create message header
    let message = `💰 *Your Wallet Balances*\n\n`;
    message += `*Total Balance:* ${formatCurrency(totalBalance)} USDC\n\n`;
    
    // Add each wallet to the message
    balances.forEach((wallet, index) => {
      const networkName = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
      const isDefault = wallet.isDefault ? ' (Default)' : '';
      
      message += `*${networkName}${isDefault}*\n`;
      message += `└ ${formatCurrency(parseFloat(wallet.balance || '0'))} USDC\n`;
      
      if (wallet.walletId) {
        message += `└ ID: \`${wallet.walletId}\`\n`;
      }
      
      if (index < balances.length - 1) {
        message += '\n';
      }
    });
    
    // Send balance message with refresh button
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh Balances', 'refresh_balance')],
        [Markup.button.callback('💸 Send Funds', 'send_funds')],
        [Markup.button.callback('📥 Deposit', 'show_deposit')]
      ])
    });
  } catch (error) {
    console.error('Failed to fetch balances:', error);
    await ctx.reply(
      '❌ Failed to fetch your wallet balances. Please try again later.',
      Markup.inlineKeyboard([
        Markup.button.callback('🔄 Try Again', 'refresh_balance')
      ])
    );
  }
}
