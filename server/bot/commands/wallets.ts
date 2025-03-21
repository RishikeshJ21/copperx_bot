import { Telegraf, Markup } from 'telegraf';
import { getWalletBalances, setDefaultWallet } from '../api/wallet';
import { formatCurrency } from '../utils/format';

export function registerWalletsCommand(bot: Telegraf) {
  // Handle /wallets command
  bot.command('wallets', async (ctx) => {
    await handleWalletsCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('👛 Wallets', async (ctx) => {
    await handleWalletsCommand(ctx);
  });
  
  // Handle refresh wallets action
  bot.action('refresh_wallets', async (ctx) => {
    await ctx.answerCbQuery('Refreshing wallets...');
    await handleWalletsCommand(ctx, true);
  });
  
  // Handle set default wallet action
  bot.action(/^set_default_wallet:(.+)$/, async (ctx) => {
    const walletId = ctx.match[1];
    await handleSetDefaultWallet(ctx, walletId);
  });
}

async function handleWalletsCommand(ctx: any, isRefresh = false) {
  try {
    // Show loading message
    const loadingMessage = await ctx.reply('Fetching your wallets...');
    
    // Get wallet balances from API
    const wallets = await getWalletBalances(ctx.session.auth.accessToken);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMessage.message_id);
    
    if (!wallets || wallets.length === 0) {
      await ctx.reply(
        '🔍 *No wallets found*\n\nYou don\'t have any wallets set up yet. Visit the Copperx web platform to set up your wallet.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('Go to Copperx', 'https://payout.copperx.io')]
          ])
        }
      );
      return;
    }
    
    // Create message header
    let message = `👛 *Your Wallets*\n\n`;
    
    // Send each wallet as a separate message with its own actions
    for (const wallet of wallets) {
      const networkName = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
      const defaultLabel = wallet.isDefault ? ' ✓ Default' : '';
      
      let walletMessage = `*${networkName} Wallet${defaultLabel}*\n\n`;
      walletMessage += `*Balance:* ${formatCurrency(parseFloat(wallet.balance || '0'))} USDC\n`;
      
      if (wallet.walletId) {
        walletMessage += `*Wallet ID:* \`${wallet.walletId}\`\n`;
      }
      
      const buttons = [];
      
      // Only show set default button for non-default wallets
      if (!wallet.isDefault) {
        buttons.push(Markup.button.callback('✅ Set as Default', `set_default_wallet:${wallet.walletId}`));
      }
      
      buttons.push(Markup.button.callback('📥 Deposit', `deposit_to:${wallet.network}`));
      
      // Create keyboard with appropriate actions
      const keyboard = Markup.inlineKeyboard([
        buttons,
        [Markup.button.callback('💸 Send from this Wallet', `send_from:${wallet.network}`)]
      ]);
      
      await ctx.reply(walletMessage, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    }
    
    // Add refresh button as a separate message
    await ctx.reply(
      'Use the buttons below:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh Wallets', 'refresh_wallets')],
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    );
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    await ctx.reply(
      '❌ Failed to fetch your wallets. Please try again later.',
      Markup.inlineKeyboard([
        Markup.button.callback('🔄 Try Again', 'refresh_wallets')
      ])
    );
  }
}

async function handleSetDefaultWallet(ctx: any, walletId: string) {
  try {
    await ctx.answerCbQuery('Setting as default wallet...');
    
    // Call API to set default wallet
    await setDefaultWallet(ctx.session.auth.accessToken, walletId);
    
    await ctx.reply(
      '✅ Default wallet updated successfully!',
      Markup.inlineKeyboard([
        [Markup.button.callback('View All Wallets', 'refresh_wallets')]
      ])
    );
  } catch (error) {
    console.error('Failed to set default wallet:', error);
    await ctx.answerCbQuery('Failed to set default wallet');
    
    await ctx.reply(
      '❌ Failed to set default wallet. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('Try Again', `set_default_wallet:${walletId}`)]
      ])
    );
  }
}
