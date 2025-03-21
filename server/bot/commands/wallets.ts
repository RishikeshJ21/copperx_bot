import { Telegraf, Markup } from 'telegraf';
import { getWalletBalances, setDefaultWallet, getSupportedNetworks, getDefaultWallet, getAllWallets } from '../api/wallet';
import { formatCurrency, formatWalletAddress, truncateWithEllipsis } from '../utils/format';
import { requireAuth } from '../middleware/auth';
import { createWalletNetworkButtons, createWalletActionButtons } from '../utils/markup';

export function registerWalletsCommand(bot: Telegraf) {
  // Handle /wallets command
  bot.command('wallets', requireAuth, async (ctx) => {
    await handleWalletsCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('👛 Wallets', requireAuth, async (ctx) => {
    await handleWalletsCommand(ctx);
  });
  
  // Handle refresh wallets action
  bot.action('refresh_wallets', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('Refreshing wallets...');
    await handleWalletsCommand(ctx, true);
  });
  
  // Handle view wallet details action
  bot.action(/^view_wallet:(.+)$/, requireAuth, async (ctx) => {
    const walletId = ctx.match[1];
    await handleViewWalletDetails(ctx, walletId);
  });
  
  // Handle set default wallet action
  bot.action(/^set_default_wallet:(.+)$/, requireAuth, async (ctx) => {
    const walletId = ctx.match[1];
    await handleSetDefaultWallet(ctx, walletId);
  });
  
  // Handle wallet action by network
  bot.action(/^wallet_action:([^:]+):(.+)$/, requireAuth, async (ctx) => {
    const action = ctx.match[1];
    const network = ctx.match[2];
    await handleWalletAction(ctx, action, network);
  });
  
  // Handle deposit to specific wallet network
  bot.action(/^deposit_to:(.+)$/, requireAuth, async (ctx) => {
    const network = ctx.match[1];
    // Forward to deposit command handler
    await ctx.scene.enter('deposit_scene', { network });
  });
  
  // Handle send from specific wallet network
  bot.action(/^send_from:(.+)$/, requireAuth, async (ctx) => {
    const network = ctx.match[1];
    // Forward to send command handler with pre-selected network
    await ctx.scene.enter('send_scene', { network });
  });
}

async function handleWalletsCommand(ctx: any, isRefresh = false) {
  try {
    // Show loading message
    const loadingMessage = await ctx.reply('Fetching your wallets...');
    
    // Get wallet balances from API
    const wallets = await getWalletBalances(ctx.session.auth.accessToken);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMessage.message_id).catch(() => {
      console.log('Could not delete loading message');
    });
    
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
    
    // Create wallet overview message
    let message = `👛 *Your Wallet Overview*\n\n`;
    
    // Calculate total balance across all wallets
    const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance || '0'), 0);
    message += `*Total Balance:* ${formatCurrency(totalBalance)} USDC\n\n`;
    message += `You have ${wallets.length} wallet${wallets.length > 1 ? 's' : ''} across ${new Set(wallets.map(w => w.network)).size} network${new Set(wallets.map(w => w.network)).size > 1 ? 's' : ''}.\n\n`;
    
    // Add default wallet info if there is one
    const defaultWallet = wallets.find(w => w.isDefault);
    if (defaultWallet) {
      const networkName = defaultWallet.network.charAt(0).toUpperCase() + defaultWallet.network.slice(1);
      message += `*Default Wallet:* ${networkName}\n`;
      message += `*Default Balance:* ${formatCurrency(parseFloat(defaultWallet.balance || '0'))} USDC\n\n`;
    }
    
    message += "Select a wallet to view details:";
    
    // Create an inline keyboard with wallet options
    const walletButtons = wallets.map(wallet => {
      const networkName = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
      const defaultLabel = wallet.isDefault ? ' ✓' : '';
      const balance = formatCurrency(parseFloat(wallet.balance || '0'));
      return [Markup.button.callback(`${networkName}${defaultLabel} - ${balance} USDC`, `view_wallet:${wallet.walletId}`)];
    });
    
    // Add refresh and back buttons
    walletButtons.push([
      Markup.button.callback('🔄 Refresh', 'refresh_wallets'),
      Markup.button.callback('🔙 Back to Menu', 'main_menu')
    ]);
    
    // Send the wallet overview message
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(walletButtons)
    });
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    await ctx.reply(
      '❌ Failed to fetch your wallets. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'refresh_wallets')],
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    );
  }
}

async function handleViewWalletDetails(ctx: any, walletId: string) {
  try {
    await ctx.answerCbQuery('Loading wallet details...');
    
    // Get all wallets to find the one with matching ID
    const wallets = await getWalletBalances(ctx.session.auth.accessToken);
    const wallet = wallets.find(w => w.walletId === walletId);
    
    if (!wallet) {
      await ctx.reply('Wallet not found. Please refresh your wallet list.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh Wallets', 'refresh_wallets')]
        ])
      );
      return;
    }
    
    const networkName = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
    const defaultLabel = wallet.isDefault ? ' (Default)' : '';
    
    let message = `*${networkName} Wallet${defaultLabel}*\n\n`;
    message += `*Balance:* ${formatCurrency(parseFloat(wallet.balance || '0'))} USDC\n`;
    message += `*Wallet ID:* \`${wallet.walletId}\`\n`;
    
    if (wallet.address) {
      message += `*Address:* \`${truncateWithEllipsis(wallet.address, 8, 6)}\`\n`;
    }
    
    if (wallet.tokenBalances && wallet.tokenBalances.length > 0) {
      message += '\n*Token Balances:*\n';
      wallet.tokenBalances.forEach(token => {
        message += `- ${token.symbol}: ${formatCurrency(parseFloat(token.balance), token.decimals)}\n`;
      });
    }
    
    // Create action buttons
    const actionButtons = [
      [
        Markup.button.callback('📥 Deposit', `deposit_to:${wallet.network}`),
        Markup.button.callback('📤 Send', `send_from:${wallet.network}`)
      ]
    ];
    
    // Add set as default button if not already default
    if (!wallet.isDefault) {
      actionButtons.push([
        Markup.button.callback('✅ Set as Default', `set_default_wallet:${wallet.walletId}`)
      ]);
    }
    
    // Add back button
    actionButtons.push([
      Markup.button.callback('👛 Back to Wallets', 'refresh_wallets')
    ]);
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(actionButtons)
    });
  } catch (error) {
    console.error('Failed to get wallet details:', error);
    await ctx.reply(
      '❌ Failed to load wallet details. Please try again.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', `view_wallet:${walletId}`)],
        [Markup.button.callback('👛 Back to Wallets', 'refresh_wallets')]
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
        [Markup.button.callback('👛 View All Wallets', 'refresh_wallets')],
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    );
  } catch (error) {
    console.error('Failed to set default wallet:', error);
    await ctx.answerCbQuery('Failed to set default wallet');
    
    await ctx.reply(
      '❌ Failed to set default wallet. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', `set_default_wallet:${walletId}`)],
        [Markup.button.callback('👛 Back to Wallets', 'refresh_wallets')]
      ])
    );
  }
}

async function handleWalletAction(ctx: any, action: string, network: string) {
  try {
    switch (action) {
      case 'deposit':
        await ctx.answerCbQuery('Loading deposit options...');
        // Forward to deposit command handler
        await ctx.scene.enter('deposit_scene', { network });
        break;
        
      case 'send':
        await ctx.answerCbQuery('Loading send options...');
        // Forward to send command handler with pre-selected network
        await ctx.scene.enter('send_scene', { network });
        break;
        
      case 'view_balance':
        await ctx.answerCbQuery('Loading balance details...');
        // Forward to balance command handler with pre-selected network
        await ctx.scene.enter('balance_scene', { network });
        break;
        
      default:
        await ctx.answerCbQuery('Unknown action');
        await ctx.reply('Sorry, that action is not supported yet.');
    }
  } catch (error) {
    console.error(`Failed to handle wallet action ${action}:`, error);
    await ctx.answerCbQuery('Action failed');
    await ctx.reply(
      `❌ Failed to perform the requested action. Please try again.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('👛 Back to Wallets', 'refresh_wallets')]
      ])
    );
  }
}
