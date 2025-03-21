import { Scenes, Markup } from 'telegraf';
import { CopperxContext } from '../models';
import { getWalletBalances } from '../api/wallet';
import { formatCurrency } from '../utils/format';
import { SCENE_IDS } from './config';
import { exitScene, handleSceneAuth } from './utils';
import { WalletBalance } from '../models/wallet';

/**
 * Interactive balance scene that shows wallet balances with refresh functionality
 * and navigation options to other financial operations
 */
export function createBalanceScene(): Scenes.BaseScene<CopperxContext> {
  // Create scene
  const scene = new Scenes.BaseScene<CopperxContext>(SCENE_IDS.BALANCE);
  
  // Handle scene entry
  scene.enter(async (ctx) => {
    await handleSceneAuth(ctx, async () => {
      await displayBalances(ctx);
    });
  });
  
  // Handle refresh action
  scene.action('refresh_balance', async (ctx) => {
    await ctx.answerCbQuery('Refreshing balances...');
    await displayBalances(ctx, true);
  });
  
  // Handle wallet details action
  scene.action(/view_wallet_(.+)/, async (ctx) => {
    if (!ctx.match || !ctx.match[1]) {
      await ctx.answerCbQuery('Invalid wallet');
      return;
    }
    
    const walletId = ctx.match[1];
    await ctx.answerCbQuery(`Viewing wallet details...`);
    await displayWalletDetails(ctx, walletId);
  });
  
  // Handle main menu return
  scene.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery('Returning to main menu');
    await exitScene(ctx, '🏠 Returning to main menu');
  });
  
  // Handle deposit action
  scene.action('deposit', async (ctx) => {
    await ctx.answerCbQuery('Going to deposit...');
    await exitScene(ctx);
    return ctx.scene.enter(SCENE_IDS.DEPOSIT);
  });
  
  // Handle send action
  scene.action('send', async (ctx) => {
    await ctx.answerCbQuery('Going to send...');
    await exitScene(ctx);
    return ctx.scene.enter(SCENE_IDS.SEND);
  });
  
  // Handle withdraw action
  scene.action('withdraw', async (ctx) => {
    await ctx.answerCbQuery('Going to withdraw...');
    await exitScene(ctx);
    return ctx.scene.enter(SCENE_IDS.WITHDRAW);
  });
  
  // Handle cancel command
  scene.command('cancel', async (ctx) => {
    await exitScene(ctx, '❌ Operation cancelled');
  });
  
  return scene;
}

/**
 * Display wallet balances
 * @param ctx Telegram context
 * @param isRefresh Whether this is a refresh operation
 */
async function displayBalances(ctx: CopperxContext, isRefresh = false): Promise<void> {
  try {
    const message = isRefresh ? 
      '🔄 Refreshing balance information...' : 
      '💰 Fetching your wallet balances...';
    
    // Show loading message if not refreshing
    if (!isRefresh) {
      await ctx.reply(message);
    }
    
    // Get access token
    const accessToken = ctx.session.auth?.accessToken;
    if (!accessToken) {
      throw new Error('No access token found. Please login first.');
    }
    
    // Fetch wallet balances
    const response = await getWalletBalances(accessToken);
    
    if (!response || !response.items || response.items.length === 0) {
      await ctx.reply(
        '❌ No wallets found. You may need to create a wallet first.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Back to Main Menu', 'main_menu')]
        ])
      );
      return;
    }
    
    const wallets: WalletBalance[] = response.items;
    
    // Calculate total balance across all wallets
    let totalBalance = 0;
    wallets.forEach((wallet: WalletBalance) => {
      totalBalance += parseFloat(wallet.balance);
    });
    
    // Create wallet list
    let messageText = `💼 *Your Wallets*\n\n`;
    messageText += `Total Balance: *${formatCurrency(totalBalance)}*\n\n`;
    
    wallets.forEach((wallet: WalletBalance, index: number) => {
      const network = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
      const balance = formatCurrency(parseFloat(wallet.balance));
      const isDefault = wallet.isDefault ? ' (Default)' : '';
      
      messageText += `*${network}${isDefault}*\n`;
      messageText += `Balance: *${balance}*\n`;
      
      if (wallet.address) {
        const shortAddress = wallet.address.substring(0, 6) + '...' + 
          wallet.address.substring(wallet.address.length - 4);
        messageText += `Address: \`${shortAddress}\`\n`;
      }
      
      if (index < wallets.length - 1) {
        messageText += '\n';
      }
    });
    
    // Create wallet action buttons
    const buttons = [
      [
        Markup.button.callback('⬆️ Deposit', 'deposit'),
        Markup.button.callback('⬇️ Withdraw', 'withdraw')
      ],
      [
        Markup.button.callback('💸 Send', 'send'),
        Markup.button.callback('🔄 Refresh', 'refresh_balance')
      ],
      [Markup.button.callback('🔙 Back to Main Menu', 'main_menu')]
    ];
    
    // Add wallet detail buttons if there are multiple wallets
    if (wallets.length > 1) {
      const walletButtons = wallets.map((wallet: WalletBalance) => {
        const network = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
        return Markup.button.callback(
          `📊 ${network} Details`, 
          `view_wallet_${wallet.walletId || wallet.network}`
        );
      });
      
      // Split wallet buttons into groups of 2
      const walletButtonRows = [];
      for (let i = 0; i < walletButtons.length; i += 2) {
        walletButtonRows.push(walletButtons.slice(i, i + 2));
      }
      
      buttons.splice(2, 0, ...walletButtonRows);
    }
    
    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching balances:', error);
    await ctx.reply(
      `❌ Error fetching your wallet balances: ${error.message || 'Unknown error'}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'refresh_balance')],
        [Markup.button.callback('🔙 Back to Main Menu', 'main_menu')]
      ])
    );
  }
}

/**
 * Display detailed wallet information
 * @param ctx Telegram context
 * @param walletId Wallet ID to show
 */
async function displayWalletDetails(ctx: CopperxContext, walletId: string): Promise<void> {
  try {
    // Get access token
    const accessToken = ctx.session.auth?.accessToken;
    if (!accessToken) {
      throw new Error('No access token found. Please login first.');
    }
    
    // Fetch all wallet balances to find the specific wallet
    const response = await getWalletBalances(accessToken);
    
    if (!response || !response.items || response.items.length === 0) {
      throw new Error('No wallets found');
    }
    
    const wallets: WalletBalance[] = response.items;
    
    // Find the selected wallet
    const wallet = wallets.find((w: WalletBalance) => w.walletId === walletId || w.network === walletId);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    // Create detailed wallet view
    const network = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
    let messageText = `📊 *${network} Wallet Details*\n\n`;
    
    messageText += `Balance: *${formatCurrency(parseFloat(wallet.balance))}*\n`;
    messageText += `Network: *${network}*\n`;
    
    if (wallet.address) {
      messageText += `Address: \`${wallet.address}\`\n`;
    }
    
    if (wallet.isDefault) {
      messageText += `Status: Default wallet\n`;
    }
    
    // Show token balances if available
    if (wallet.tokenBalances && wallet.tokenBalances.length > 0) {
      messageText += `\n*Token Balances:*\n`;
      wallet.tokenBalances.forEach((token: TokenBalance) => {
        messageText += `${token.symbol}: ${token.balance}\n`;
      });
    }
    
    // Create action buttons
    const buttons = [
      [
        Markup.button.callback('⬆️ Deposit', 'deposit'),
        Markup.button.callback('⬇️ Withdraw', 'withdraw')
      ],
      [
        Markup.button.callback('💸 Send', 'send'),
        Markup.button.callback('🔙 Back to Wallets', 'refresh_balance')
      ],
      [Markup.button.callback('🔙 Back to Main Menu', 'main_menu')]
    ];
    
    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching wallet details:', error);
    await ctx.reply(
      `❌ Error fetching wallet details: ${error.message || 'Unknown error'}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back to Wallets', 'refresh_balance')],
        [Markup.button.callback('🔙 Back to Main Menu', 'main_menu')]
      ])
    );
  }
}

// For TypeScript
interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
}