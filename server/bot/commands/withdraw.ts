import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { getWalletBalances } from '../api/wallet';
import { withdrawToWallet, withdrawToBank } from '../api/transfer';
import { formatCurrency } from '../utils/format';
import { isValidWalletAddress, isValidAmount, isValidBankDetails } from '../utils/validation';

// Define withdraw flow steps
enum WithdrawStep {
  IDLE = 'idle',
  SELECT_METHOD = 'select_method',
  ENTER_RECIPIENT = 'enter_recipient',
  ENTER_AMOUNT = 'enter_amount',
  ENTER_BANK_DETAILS = 'enter_bank_details',
  SELECT_NETWORK = 'select_network',
  CONFIRM_TRANSACTION = 'confirm_transaction',
}

// Withdraw state interface for session
interface WithdrawState {
  step: WithdrawStep;
  method?: 'wallet' | 'bank';
  recipient?: string;
  amount?: string;
  network?: string;
  fee?: string;
  wallets?: any[];
  bankDetails?: any;
}

export function registerWithdrawCommand(bot: Telegraf) {
  // Handle /withdraw command
  bot.command('withdraw', async (ctx) => {
    await startWithdrawFlow(ctx);
  });
  
  // Action handlers for withdraw flow
  bot.action('withdraw_method_wallet', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.withdraw.method = 'wallet';
    ctx.session.withdraw.step = WithdrawStep.ENTER_RECIPIENT;
    
    await ctx.reply(
      '🔑 *Withdraw to External Wallet*\n\nPlease enter the destination wallet address:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Cancel', 'cancel_withdraw')
        ])
      }
    );
  });
  
  bot.action('withdraw_method_bank', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.withdraw.method = 'bank';
    ctx.session.withdraw.step = WithdrawStep.ENTER_AMOUNT;
    
    await ctx.reply(
      '🏦 *Withdraw to Bank Account*\n\nPlease enter the amount to withdraw in USDC:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Cancel', 'cancel_withdraw')
        ])
      }
    );
  });
  
  // Handle network selection
  bot.action(/^withdraw_network:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const network = ctx.match[1];
    
    ctx.session.withdraw.network = network;
    
    // Get selected wallet info
    const wallet = ctx.session.withdraw.wallets?.find((w: any) => w.network === network);
    
    // Check if sufficient balance
    if (wallet && parseFloat(wallet.balance) < parseFloat(ctx.session.withdraw.amount || '0')) {
      await ctx.reply(
        `⚠️ *Insufficient Balance*\n\nThe selected wallet has insufficient balance for this withdrawal.\n\nAvailable balance: ${formatCurrency(parseFloat(wallet.balance))} USDC\nWithdrawal amount: ${formatCurrency(parseFloat(ctx.session.withdraw.amount || '0'))} USDC`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Select Different Network', 'select_withdraw_network_again')],
            [Markup.button.callback('Cancel Withdrawal', 'cancel_withdraw')]
          ])
        }
      );
      return;
    }
    
    // If bank withdrawal, go to bank details entry
    if (ctx.session.withdraw.method === 'bank') {
      ctx.session.withdraw.step = WithdrawStep.ENTER_BANK_DETAILS;
      
      await ctx.reply(
        '🏦 *Bank Account Details*\n\nPlease enter your bank account details in the following format:\n\n`Bank Name\nAccount Holder Name\nAccount Number\nRouting Number (if applicable)\nReference (optional)`',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('Cancel', 'cancel_withdraw')
          ])
        }
      );
      return;
    }
    
    // For wallet withdrawals, show confirmation directly
    ctx.session.withdraw.step = WithdrawStep.CONFIRM_TRANSACTION;
    await showWithdrawConfirmation(ctx);
  });
  
  // Handle confirmation
  bot.action('confirm_withdraw', async (ctx) => {
    await ctx.answerCbQuery();
    await processWithdrawal(ctx);
  });
  
  // Handle cancellation
  bot.action('cancel_withdraw', async (ctx) => {
    await ctx.answerCbQuery();
    delete ctx.session.withdraw;
    
    await ctx.reply(
      '❌ Withdrawal cancelled. Use /withdraw to start a new withdrawal.',
      Markup.removeKeyboard()
    );
  });
  
  // Handle back to network selection
  bot.action('select_withdraw_network_again', async (ctx) => {
    await ctx.answerCbQuery();
    await selectWithdrawNetwork(ctx);
  });
  
  // Handle text input during withdraw flow
  bot.on(message('text'), async (ctx) => {
    const withdrawState = ctx.session.withdraw as WithdrawState;
    
    // Skip if not in withdraw flow
    if (!withdrawState || withdrawState.step === WithdrawStep.IDLE) {
      return;
    }
    
    if (withdrawState.step === WithdrawStep.ENTER_RECIPIENT) {
      await handleWithdrawRecipientInput(ctx, withdrawState);
    } else if (withdrawState.step === WithdrawStep.ENTER_AMOUNT) {
      await handleWithdrawAmountInput(ctx, withdrawState);
    } else if (withdrawState.step === WithdrawStep.ENTER_BANK_DETAILS) {
      await handleBankDetailsInput(ctx, withdrawState);
    }
  });
}

// Helper functions
async function startWithdrawFlow(ctx: any) {
  try {
    // Initialize withdraw state
    ctx.session.withdraw = {
      step: WithdrawStep.SELECT_METHOD,
    };
    
    // Fetch wallet balances first for later use
    const loadingMsg = await ctx.reply('Loading your wallets...');
    
    try {
      const wallets = await getWalletBalances(ctx.session.auth.accessToken);
      ctx.session.withdraw.wallets = wallets;
      
      await ctx.deleteMessage(loadingMsg.message_id);
      
      // Show withdraw method selection
      await ctx.reply(
        '🤔 *How would you like to withdraw funds?*\n\nChoose a withdraw method:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔑 External Wallet', 'withdraw_method_wallet')],
            [Markup.button.callback('🏦 Bank Account', 'withdraw_method_bank')],
            [Markup.button.callback('Cancel', 'cancel_withdraw')]
          ])
        }
      );
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      await ctx.deleteMessage(loadingMsg.message_id);
      
      await ctx.reply(
        '❌ Failed to load your wallets. Please try again later.',
        Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'withdraw')
        ])
      );
    }
  } catch (error) {
    console.error('Failed to start withdraw flow:', error);
    await ctx.reply('Failed to start withdraw flow. Please try again later.');
  }
}

async function handleWithdrawRecipientInput(ctx: any, withdrawState: WithdrawState) {
  const recipient = ctx.message.text.trim();
  
  // Validate wallet address for wallet withdrawals
  if (!isValidWalletAddress(recipient)) {
    await ctx.reply(
      '❌ Invalid wallet address format. Please check the address and try again:',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_withdraw')
      ])
    );
    return;
  }
  
  // Store recipient and move to amount
  withdrawState.recipient = recipient;
  withdrawState.step = WithdrawStep.ENTER_AMOUNT;
  
  await ctx.reply(
    `*Destination Address: ${recipient}*\n\nPlease enter the amount to withdraw in USDC:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_withdraw')
      ])
    }
  );
}

async function handleWithdrawAmountInput(ctx: any, withdrawState: WithdrawState) {
  const amount = ctx.message.text.trim();
  
  // Validate amount
  if (!isValidAmount(amount)) {
    await ctx.reply(
      '❌ Invalid amount format. Please enter a valid number (e.g., 100.50):',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_withdraw')
      ])
    );
    return;
  }
  
  // Check if amount is too small
  const minAmount = withdrawState.method === 'bank' ? 100 : 10; // Higher minimum for bank withdrawals
  
  if (parseFloat(amount) < minAmount) {
    await ctx.reply(
      `❌ Minimum withdrawal amount is ${minAmount} USDC. Please enter a larger amount:`,
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_withdraw')
      ])
    );
    return;
  }
  
  // Store amount and move to network selection
  withdrawState.amount = amount;
  
  // Select network
  await selectWithdrawNetwork(ctx);
}

async function handleBankDetailsInput(ctx: any, withdrawState: WithdrawState) {
  const bankDetailsText = ctx.message.text.trim();
  
  // Simple validation for bank details
  if (!isValidBankDetails(bankDetailsText)) {
    await ctx.reply(
      '❌ Invalid bank details format. Please provide more complete information:',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_withdraw')
      ])
    );
    return;
  }
  
  // Parse and store bank details
  const lines = bankDetailsText.split('\n');
  
  withdrawState.bankDetails = {
    bankName: lines[0] || '',
    accountName: lines[1] || '',
    accountNumber: lines[2] || '',
    routingNumber: lines[3] || '',
    reference: lines[4] || '',
  };
  
  withdrawState.step = WithdrawStep.CONFIRM_TRANSACTION;
  
  // Show confirmation
  await showWithdrawConfirmation(ctx);
}

async function selectWithdrawNetwork(ctx: any) {
  // Update step
  ctx.session.withdraw.step = WithdrawStep.SELECT_NETWORK;
  
  // Get available networks from wallets
  const wallets = ctx.session.withdraw.wallets || [];
  
  if (wallets.length === 0) {
    await ctx.reply(
      '❌ No wallets available. Please set up your wallets on the Copperx web platform first.',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_withdraw')
      ])
    );
    return;
  }
  
  // Create network selection buttons
  const buttons = wallets.map(wallet => {
    const networkName = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
    const balance = formatCurrency(parseFloat(wallet.balance || '0'));
    const defaultMark = wallet.isDefault ? ' (Default)' : '';
    
    return [Markup.button.callback(
      `${networkName}${defaultMark} - ${balance} USDC`,
      `withdraw_network:${wallet.network}`
    )];
  });
  
  // Add cancel button
  buttons.push([Markup.button.callback('Cancel', 'cancel_withdraw')]);
  
  await ctx.reply(
    '🌐 *Select Source Network*\n\nChoose which network to withdraw from:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    }
  );
}

async function showWithdrawConfirmation(ctx: any) {
  const withdrawState = ctx.session.withdraw;
  
  // Format network name
  const networkName = withdrawState.network?.charAt(0).toUpperCase() + withdrawState.network?.slice(1);
  
  // Create confirmation message
  let message = '🔍 *Withdrawal Preview*\n\n';
  message += `*Amount:* ${formatCurrency(parseFloat(withdrawState.amount || '0'))} USDC\n`;
  message += `*From Network:* ${networkName}\n`;
  
  if (withdrawState.method === 'wallet') {
    message += `*To Wallet Address:* ${withdrawState.recipient}\n`;
    message += '*Estimated Fee:* Fee will be deducted from withdrawal amount\n';
  } else if (withdrawState.method === 'bank') {
    message += '*Withdrawal Method:* Bank Account\n';
    message += `*Bank Name:* ${withdrawState.bankDetails?.bankName}\n`;
    message += `*Account Holder:* ${withdrawState.bankDetails?.accountName}\n`;
    message += `*Account Number:* ${withdrawState.bankDetails?.accountNumber.substr(0, 4)}...${withdrawState.bankDetails?.accountNumber.substr(-4)}\n`;
    message += '*Estimated Fee:* Bank fees will apply\n';
  }
  
  message += '\n⚠️ *Withdrawals may take 1-3 business days to process.*\n\nPlease confirm this withdrawal:';
  
  await ctx.reply(
    message,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm Withdrawal', 'confirm_withdraw')],
        [Markup.button.callback('🔄 Change Network', 'select_withdraw_network_again')],
        [Markup.button.callback('❌ Cancel', 'cancel_withdraw')]
      ])
    }
  );
}

async function processWithdrawal(ctx: any) {
  const withdrawState = ctx.session.withdraw;
  
  // Show processing message
  const loadingMsg = await ctx.reply('💳 Processing your withdrawal...');
  
  try {
    let result;
    
    // Call appropriate API based on withdrawal method
    if (withdrawState.method === 'wallet') {
      result = await withdrawToWallet(
        ctx.session.auth.accessToken,
        withdrawState.recipient!,
        withdrawState.amount!,
        withdrawState.network!
      );
    } else if (withdrawState.method === 'bank') {
      result = await withdrawToBank(
        ctx.session.auth.accessToken,
        withdrawState.amount!,
        withdrawState.network!,
        withdrawState.bankDetails
      );
    }
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    // Show success message
    await ctx.reply(
      `✅ *Withdrawal Initiated!*\n\n${formatCurrency(parseFloat(withdrawState.amount!))} USDC withdrawal has been initiated from your ${withdrawState.network} wallet.\n\nWithdrawal ID: \`${result?.transferId || 'Not available'}\`\n\nYour withdrawal is being processed and may take 1-3 business days to complete.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('View Balance', 'refresh_balance')],
          [Markup.button.callback('View History', 'view_history')],
          [Markup.button.callback('Back to Menu', 'main_menu')]
        ])
      }
    );
    
    // Clean up session
    delete ctx.session.withdraw;
  } catch (error) {
    console.error('Withdrawal failed:', error);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    // Show error message
    await ctx.reply(
      `❌ *Withdrawal Failed*\n\nWe couldn't process your withdrawal. ${error.message || 'Please try again later.'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Try Again', 'withdraw')],
          [Markup.button.callback('Cancel', 'cancel_withdraw')]
        ])
      }
    );
  }
}
