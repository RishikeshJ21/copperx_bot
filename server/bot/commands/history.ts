import { Telegraf, Markup } from 'telegraf';
import { getTransferHistory } from '../api/transfer';
import { formatCurrency } from '../utils/format';
import { formatDate } from '../utils/format';

export function registerHistoryCommand(bot: Telegraf) {
  // Handle /history command
  bot.command('history', async (ctx) => {
    await handleHistoryCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('📋 History', async (ctx) => {
    await handleHistoryCommand(ctx);
  });
  
  // Handle view history action
  bot.action('view_history', async (ctx) => {
    await ctx.answerCbQuery();
    await handleHistoryCommand(ctx);
  });
  
  // Handle pagination
  bot.action(/^history_page:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await showTransactionHistory(ctx, page);
  });
  
  // Handle filter actions
  bot.action(/^filter_history:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const filter = ctx.match[1];
    
    // Store filter in session
    ctx.session.historyFilter = filter === 'all' ? undefined : filter;
    
    // Reset to first page with new filter
    await showTransactionHistory(ctx, 1);
  });
  
  // Handle transaction details
  bot.action(/^transaction_details:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const transferId = ctx.match[1];
    await showTransactionDetails(ctx, transferId);
  });
}

async function handleHistoryCommand(ctx: any) {
  // Reset history filter
  ctx.session.historyFilter = undefined;
  
  // Show first page of transaction history
  await showTransactionHistory(ctx, 1);
}

async function showTransactionHistory(ctx: any, page: number) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Loading your transaction history...');
    
    // Page size
    const limit = 5;
    const offset = (page - 1) * limit;
    
    // Get filter from session if exists
    const filter = ctx.session.historyFilter;
    
    // Get transaction history from API
    const { transfers, total } = await getTransferHistory(
      ctx.session.auth.accessToken,
      limit,
      offset,
      filter
    );
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    if (!transfers || transfers.length === 0) {
      await ctx.reply(
        '🔍 *No Transactions Found*\n\n' + 
        (filter ? `No ${filter} transactions found.` : 'You don\'t have any transactions yet.'),
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            ...(filter ? [[Markup.button.callback('Show All Transactions', 'filter_history:all')]] : []),
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
          ])
        }
      );
      return;
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    // Create message header
    let message = `📋 *Transaction History*`;
    message += filter ? ` (${filter})` : '';
    message += `\nPage ${page} of ${totalPages}\n\n`;
    
    // Add each transaction to the message
    transfers.forEach((transfer, index) => {
      const amount = parseFloat(transfer.amount);
      const isPositive = transfer.type === 'deposit' || transfer.direction === 'in';
      const amountStr = isPositive ? `+${formatCurrency(amount)}` : `-${formatCurrency(amount)}`;
      const amountColor = isPositive ? '🟢' : '🔴';
      const date = formatDate(transfer.createdAt);
      
      message += `${amountColor} ${amountStr} USDC - ${transfer.type.toUpperCase()}\n`;
      message += `└ ${date} • ${transfer.network || 'Unknown Network'}\n`;
      
      if (transfer.recipient) {
        message += `└ ${transfer.recipient}\n`;
      }
      
      message += `└ ID: \`${transfer.id}\`\n`;
      
      if (index < transfers.length - 1) {
        message += '\n';
      }
    });
    
    // Create pagination buttons
    const paginationButtons = [];
    
    if (page > 1) {
      paginationButtons.push(Markup.button.callback('◀️ Previous', `history_page:${page - 1}`));
    }
    
    if (page < totalPages) {
      paginationButtons.push(Markup.button.callback('Next ▶️', `history_page:${page + 1}`));
    }
    
    // Create filter buttons
    const filterButtons = [
      Markup.button.callback('All', 'filter_history:all'),
      Markup.button.callback('Deposits', 'filter_history:deposit'),
      Markup.button.callback('Withdrawals', 'filter_history:withdraw'),
      Markup.button.callback('Sends', 'filter_history:send')
    ];
    
    // Send transaction history with buttons
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        paginationButtons,
        filterButtons,
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    });
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    await ctx.reply(
      '❌ Failed to load your transaction history. Please try again later.',
      Markup.inlineKeyboard([
        Markup.button.callback('🔄 Try Again', 'view_history')
      ])
    );
  }
}

async function showTransactionDetails(ctx: any, transferId: string) {
  try {
    // This would typically call an API to get detailed transaction information
    // For now, we'll just show a placeholder
    
    await ctx.reply(
      `*Transaction Details*\n\nTransaction ID: \`${transferId}\`\n\nSorry, detailed transaction information is not available in this preview version.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Back to History', 'view_history')]
        ])
      }
    );
  } catch (error) {
    console.error('Failed to fetch transaction details:', error);
    await ctx.reply(
      '❌ Failed to load transaction details. Please try again later.',
      Markup.inlineKeyboard([
        Markup.button.callback('Back to History', 'view_history')
      ])
    );
  }
}
