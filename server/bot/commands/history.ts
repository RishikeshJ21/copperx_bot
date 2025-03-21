import { Telegraf, Markup } from 'telegraf';
import { getTransferHistory, getTransferDetails } from '../api/transfer';
import { formatCurrency, formatDate, formatTransactionStatus, truncateWithEllipsis } from '../utils/format';
import { requireAuth } from '../middleware/auth';
import { createHistoryFilterButtons, createPaginationButtons } from '../utils/markup';
import { TransferStatus, TransferType } from '../models/transfer';

export function registerHistoryCommand(bot: Telegraf) {
  // Handle /history command
  bot.command('history', requireAuth, async (ctx) => {
    await handleHistoryCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('📋 History', requireAuth, async (ctx) => {
    await handleHistoryCommand(ctx);
  });
  
  // Handle view history action
  bot.action('view_history', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('Loading transaction history...');
    await handleHistoryCommand(ctx);
  });
  
  // Handle pagination
  bot.action(/^history_page:(\d+)$/, requireAuth, async (ctx) => {
    await ctx.answerCbQuery('Loading page...');
    const page = parseInt(ctx.match[1]);
    await showTransactionHistory(ctx, page);
  });
  
  // Handle filter actions
  bot.action(/^filter_history:(.+)$/, requireAuth, async (ctx) => {
    const filter = ctx.match[1];
    await ctx.answerCbQuery(`Filtering by ${filter === 'all' ? 'all transactions' : filter}...`);
    
    // Store filter in session
    ctx.session.historyFilter = filter === 'all' ? undefined : filter;
    
    // Reset to first page with new filter
    await showTransactionHistory(ctx, 1);
  });
  
  // Handle sort actions
  bot.action(/^sort_history:(.+)$/, requireAuth, async (ctx) => {
    const sortBy = ctx.match[1];
    await ctx.answerCbQuery(`Sorting by ${sortBy}...`);
    
    // Store sort in session
    ctx.session.historySort = sortBy;
    
    // Reset to first page with new sort
    await showTransactionHistory(ctx, 1);
  });
  
  // Handle transaction details
  bot.action(/^transaction_details:(.+)$/, requireAuth, async (ctx) => {
    const transferId = ctx.match[1];
    await ctx.answerCbQuery('Loading transaction details...');
    await showTransactionDetails(ctx, transferId);
  });
  
  // Handle export history action
  bot.action('export_history', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('This feature is coming soon!');
    await ctx.reply(
      '📊 *Export Transactions*\n\nThe ability to export your transaction history will be available soon. Please check back later!',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Back to History', 'view_history')]
        ])
      }
    );
  });
  
  // Handle detailed search action
  bot.action('search_transactions', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('This feature is coming soon!');
    await ctx.reply(
      '🔍 *Search Transactions*\n\nAdvanced transaction search will be available soon. Please check back later!',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Back to History', 'view_history')]
        ])
      }
    );
  });
}

async function handleHistoryCommand(ctx: any) {
  try {
    // Reset history filter and sort if not already set
    if (!ctx.session.historyFilter && !ctx.session.historySort) {
      ctx.session.historyFilter = undefined;
      ctx.session.historySort = 'newest';
    }
    
    // Show first page of transaction history
    await showTransactionHistory(ctx, 1);
  } catch (error) {
    console.error('Failed to initialize history view:', error);
    await ctx.reply(
      '❌ Failed to initialize transaction history. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'view_history')],
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    );
  }
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
    const history = await getTransferHistory(
      ctx.session.auth.accessToken,
      page,
      limit,
      filter
    );
    
    const transfers = history.items || [];
    const total = history.total || 0;
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {
      console.log('Could not delete loading message');
    });
    
    if (!transfers || transfers.length === 0) {
      // Show no transactions message with appropriate options
      const filterName = filter ? filter.charAt(0).toUpperCase() + filter.slice(1) : '';
      
      await ctx.reply(
        '🔍 *No Transactions Found*\n\n' + 
        (filter ? `No ${filterName} transactions found.` : 'You don\'t have any transactions yet.'),
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            ...(filter ? [[Markup.button.callback('Show All Transactions', 'filter_history:all')]] : []),
            [Markup.button.callback('💸 Make a Transfer', 'send_funds')],
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
          ])
        }
      );
      return;
    }
    
    // Calculate total pages
    const totalPages = Math.max(1, Math.ceil(total / limit));
    
    // Create message header
    const filterName = filter ? filter.charAt(0).toUpperCase() + filter.slice(1) : 'All';
    let message = `📋 *${filterName} Transactions*\n`;
    message += `Page ${page} of ${totalPages} (${total} total)\n\n`;
    
    // Add each transaction to the message with clickable details
    transfers.forEach((transfer: any, index: number) => {
      const amount = parseFloat(transfer.amount);
      const isPositive = transfer.type === TransferType.DEPOSIT || transfer.direction === 'in';
      const amountStr = isPositive ? `+${formatCurrency(amount)}` : `-${formatCurrency(amount)}`;
      const amountColor = isPositive ? '🟢' : '🔴';
      const date = formatDate(transfer.createdAt, 'short');
      const status = formatTransactionStatus(transfer.status);
      const transferType = transfer.type.charAt(0).toUpperCase() + transfer.type.slice(1);
      
      // Make each transaction a clickable item
      message += `${index + 1}. ${amountColor} ${amountStr} USDC - ${transferType}\n`;
      message += `   ${date} • ${status}\n`;
      message += `   ${transfer.network || 'Unknown Network'}\n`;
      
      // Show recipient if available
      if (transfer.recipient) {
        const recipientDisplay = transfer.recipientEmail || truncateWithEllipsis(transfer.recipient, 8, 4);
        message += `   To: ${recipientDisplay}\n`;
      }
      
      // Add a clickable detail ID at the bottom
      message += `   [View Details](botcommand://transaction_details:${transfer.transferId})\n\n`;
    });
    
    // Create pagination buttons
    const paginationButtons = [];
    
    // Only show pagination if needed
    if (totalPages > 1) {
      if (page > 1) {
        paginationButtons.push(Markup.button.callback('◀️ Previous', `history_page:${page - 1}`));
      }
      
      // Add page indicator
      paginationButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'dummy_action'));
      
      if (page < totalPages) {
        paginationButtons.push(Markup.button.callback('Next ▶️', `history_page:${page + 1}`));
      }
    }
    
    // Create control buttons
    const controlButtons = [
      [Markup.button.callback('🔍 Search', 'search_transactions'), Markup.button.callback('📊 Export', 'export_history')]
    ];
    
    // Create filter buttons - simplified for better UX
    const filterButtons = [
      [
        Markup.button.callback(filter === undefined ? '✓ All' : 'All', 'filter_history:all'),
        Markup.button.callback(filter === 'deposit' ? '✓ Deposits' : 'Deposits', 'filter_history:deposit')
      ],
      [
        Markup.button.callback(filter === 'withdrawal' ? '✓ Withdrawals' : 'Withdrawals', 'filter_history:withdrawal'),
        Markup.button.callback(filter === 'send' ? '✓ Sends' : 'Sends', 'filter_history:send')
      ]
    ];
    
    const menuButtons = [
      [Markup.button.callback('🔄 Refresh', 'view_history')],
      [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
    ];
    
    const allButtons = [
      ...(paginationButtons.length > 0 ? [paginationButtons] : []),
      ...filterButtons,
      ...controlButtons,
      ...menuButtons
    ];
    
    // Send transaction history with buttons
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard(allButtons)
    });
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    await ctx.reply(
      '❌ Failed to load your transaction history. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'view_history')],
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    );
  }
}

async function showTransactionDetails(ctx: any, transferId: string) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Loading transaction details...');
    
    // Call API to get transaction details
    const transfer = await getTransferDetails(ctx.session.auth.accessToken, transferId);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {
      console.log('Could not delete loading message');
    });
    
    if (!transfer) {
      await ctx.reply(
        '❌ *Transaction Not Found*\n\nThe requested transaction could not be found.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Back to History', 'view_history')]
          ])
        }
      );
      return;
    }
    
    // Format the transaction details
    const isPositive = transfer.type === TransferType.DEPOSIT || transfer.direction === 'in';
    const amountColor = isPositive ? '🟢' : '🔴';
    const amountStr = isPositive ? `+${formatCurrency(parseFloat(transfer.amount))}` : `-${formatCurrency(parseFloat(transfer.amount))}`;
    const status = formatTransactionStatus(transfer.status);
    const createdDate = formatDate(transfer.createdAt, 'long');
    const completedDate = transfer.completedAt ? formatDate(transfer.completedAt, 'long') : 'Pending';
    const transferType = transfer.type.charAt(0).toUpperCase() + transfer.type.slice(1);
    
    let message = `🧾 *Transaction Details*\n\n`;
    message += `*Type:* ${transferType}\n`;
    message += `*Amount:* ${amountColor} ${amountStr} USDC\n`;
    message += `*Status:* ${status}\n`;
    message += `*Network:* ${transfer.network || 'Unknown'}\n`;
    message += `*Date:* ${createdDate}\n`;
    
    if (transfer.completedAt) {
      message += `*Completed:* ${completedDate}\n`;
    }
    
    if (transfer.fee) {
      message += `*Fee:* ${formatCurrency(parseFloat(transfer.fee))} USDC\n`;
    }
    
    // Add recipient details if available
    if (transfer.recipient) {
      message += `\n*Recipient:* ${transfer.recipientEmail || transfer.recipient}\n`;
      if (transfer.walletAddress) {
        message += `*Wallet Address:* \`${truncateWithEllipsis(transfer.walletAddress, 10, 4)}\`\n`;
      }
    }
    
    // Add bank details if available (for withdrawals)
    if (transfer.bankDetails) {
      message += '\n*Bank Details:*\n';
      if (transfer.bankDetails.bankName) message += `Bank: ${transfer.bankDetails.bankName}\n`;
      if (transfer.bankDetails.accountName) message += `Account Name: ${transfer.bankDetails.accountName}\n`;
      if (transfer.bankDetails.reference) message += `Reference: ${transfer.bankDetails.reference}\n`;
    }
    
    // Add transaction ID at the bottom
    message += `\n*Transaction ID:* \`${transfer.transferId}\`\n`;
    
    // Create action buttons based on transaction status
    const actionButtons = [];
    
    if (transfer.status === TransferStatus.PENDING) {
      actionButtons.push([
        Markup.button.callback('🔄 Check Status', `transaction_details:${transfer.transferId}`),
      ]);
    } else if (transfer.status === TransferStatus.FAILED) {
      actionButtons.push([
        Markup.button.callback('🔄 Try Again', 'send_funds'),
      ]);
    }
    
    // Add navigation buttons
    actionButtons.push([
      Markup.button.callback('📋 Back to History', 'view_history'),
      Markup.button.callback('🔙 Back to Menu', 'main_menu')
    ]);
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(actionButtons)
    });
  } catch (error) {
    console.error('Failed to fetch transaction details:', error);
    await ctx.reply(
      '❌ Failed to load transaction details. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('Back to History', 'view_history')],
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    );
  }
}
