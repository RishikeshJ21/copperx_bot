import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { getWalletBalances } from '../api/wallet';
import { sendFunds, getTransferFee } from '../api/transfer';
import { formatCurrency } from '../utils/format';
import { isValidEmail, isValidWalletAddress, isValidAmount } from '../utils/validation';

// Define send flow steps
enum SendStep {
  IDLE = 'idle',
  SELECT_METHOD = 'select_method',
  ENTER_RECIPIENT = 'enter_recipient',
  ENTER_AMOUNT = 'enter_amount',
  CONFIRM_TRANSACTION = 'confirm_transaction',
}

// Send state interface for session
interface SendState {
  step: SendStep;
  method?: 'email' | 'wallet';
  recipient?: string;
  amount?: string;
  network?: string;
  fee?: string;
  wallets?: any[];
}

export function registerSendCommand(bot: Telegraf) {
  // Handle /send command
  bot.command('send', async (ctx) => {
    await startSendFlow(ctx);
  });
  
  // Also handle the text command
  bot.hears('📤 Send', async (ctx) => {
    await startSendFlow(ctx);
  });
  
  // Handle send method selection
  bot.action('send_method_email', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.send.method = 'email';
    ctx.session.send.step = SendStep.ENTER_RECIPIENT;
    
    await ctx.reply(
      '✉️ *Send to Email*\n\nPlease enter the recipient\'s email address:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Cancel', 'cancel_send')
        ])
      }
    );
  });
  
  bot.action('send_method_wallet', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.send.method = 'wallet';
    ctx.session.send.step = SendStep.ENTER_RECIPIENT;
    
    await ctx.reply(
      '🔑 *Send to Wallet Address*\n\nPlease enter the recipient\'s wallet address:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Cancel', 'cancel_send')
        ])
      }
    );
  });
  
  // Handle network selection
  bot.action(/^send_network:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const network = ctx.match[1];
    
    ctx.session.send.network = network;
    
    // Get selected wallet info
    const wallet = ctx.session.send.wallets?.find((w: any) => w.network === network);
    
    // Check if sufficient balance
    if (wallet && parseFloat(wallet.balance) < parseFloat(ctx.session.send.amount || '0')) {
      await ctx.reply(
        `⚠️ *Insufficient Balance*\n\nThe selected wallet has insufficient balance for this transaction.\n\nAvailable balance: ${formatCurrency(parseFloat(wallet.balance))} USDC\nTransaction amount: ${formatCurrency(parseFloat(ctx.session.send.amount || '0'))} USDC`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Select Different Network', 'select_network_again')],
            [Markup.button.callback('Cancel Transaction', 'cancel_send')]
          ])
        }
      );
      return;
    }
    
    // Try to get the transfer fee
    try {
      const fee = await getTransferFee(
        ctx.session.auth.accessToken, 
        ctx.session.send.amount || '0',
        ctx.session.send.method === 'email' ? 'email' : 'wallet',
        network
      );
      
      ctx.session.send.fee = fee.toString();
      
      // Show confirmation with fee
      await showTransactionConfirmation(ctx);
    } catch (error) {
      console.error('Failed to get transfer fee:', error);
      
      // Proceed with confirmation anyway, but show warning
      ctx.session.send.fee = 'unknown';
      await showTransactionConfirmation(ctx, true);
    }
  });
  
  // Handle confirmation
  bot.action('confirm_send', async (ctx) => {
    await ctx.answerCbQuery();
    await processTransaction(ctx);
  });
  
  // Handle cancellation
  bot.action('cancel_send', async (ctx) => {
    await ctx.answerCbQuery();
    delete ctx.session.send;
    
    await ctx.reply(
      '❌ Transaction cancelled. Use /send to start a new transaction.',
      Markup.removeKeyboard()
    );
  });
  
  // Handle back to network selection
  bot.action('select_network_again', async (ctx) => {
    await ctx.answerCbQuery();
    await selectNetwork(ctx);
  });
  
  // Handle back to main menu
  bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    delete ctx.session.send;
    
    await ctx.reply(
      '🔙 Back to main menu',
      Markup.keyboard([
        ['💰 Balance', '👛 Wallets'],
        ['📤 Send', '📥 Deposit'],
        ['📋 History', '👤 Profile'],
        ['💼 KYC Status', '❓ Help']
      ]).resize()
    );
  });
  
  // Handle action triggered from balance command
  bot.action('send_funds', async (ctx) => {
    await ctx.answerCbQuery();
    await startSendFlow(ctx);
  });
  
  // Handle wallet-specific send action
  bot.action(/^send_from:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const network = ctx.match[1];
    
    // Initialize send flow but pre-select the network
    await startSendFlow(ctx, network);
  });
  
  // Handle text input during send flow
  bot.on(message('text'), async (ctx) => {
    const sendState = ctx.session.send as SendState;
    
    // Skip if not in send flow
    if (!sendState || sendState.step === SendStep.IDLE) {
      return;
    }
    
    if (sendState.step === SendStep.ENTER_RECIPIENT) {
      await handleRecipientInput(ctx, sendState);
    } else if (sendState.step === SendStep.ENTER_AMOUNT) {
      await handleAmountInput(ctx, sendState);
    }
  });
}

// Helper functions
async function startSendFlow(ctx: any, preSelectedNetwork?: string) {
  try {
    // Initialize send state
    ctx.session.send = {
      step: SendStep.SELECT_METHOD,
      network: preSelectedNetwork,
    };
    
    // Fetch wallet balances first for later use
    const loadingMsg = await ctx.reply('Loading your wallets...');
    
    try {
      const wallets = await getWalletBalances(ctx.session.auth.accessToken);
      ctx.session.send.wallets = wallets;
      
      await ctx.deleteMessage(loadingMsg.message_id);
      
      // If we have a pre-selected network, skip method selection and go to recipient
      if (preSelectedNetwork) {
        await ctx.reply(
          '🤔 *How would you like to send funds?*\n\nChoose a send method:',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✉️ Send to Email', 'send_method_email')],
              [Markup.button.callback('🔑 Send to Wallet Address', 'send_method_wallet')],
              [Markup.button.callback('Cancel', 'cancel_send')]
            ])
          }
        );
      } else {
        // Normal flow, ask for send method
        await ctx.reply(
          '🤔 *How would you like to send funds?*\n\nChoose a send method:',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✉️ Send to Email', 'send_method_email')],
              [Markup.button.callback('🔑 Send to Wallet Address', 'send_method_wallet')],
              [Markup.button.callback('Cancel', 'cancel_send')]
            ])
          }
        );
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      await ctx.deleteMessage(loadingMsg.message_id);
      
      await ctx.reply(
        '❌ Failed to load your wallets. Please try again later.',
        Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'send_funds')
        ])
      );
    }
  } catch (error) {
    console.error('Failed to start send flow:', error);
    await ctx.reply('Failed to start send flow. Please try again later.');
  }
}

async function handleRecipientInput(ctx: any, sendState: SendState) {
  const recipient = ctx.message.text.trim();
  
  // Validate recipient based on method
  if (sendState.method === 'email' && !isValidEmail(recipient)) {
    await ctx.reply(
      '❌ Invalid email format. Please enter a valid email address:',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_send')
      ])
    );
    return;
  } else if (sendState.method === 'wallet' && !isValidWalletAddress(recipient)) {
    await ctx.reply(
      '❌ Invalid wallet address format. Please check the address and try again:',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_send')
      ])
    );
    return;
  }
  
  // Store recipient and move to amount
  sendState.recipient = recipient;
  sendState.step = SendStep.ENTER_AMOUNT;
  
  await ctx.reply(
    `*Recipient: ${recipient}*\n\nPlease enter the amount to send in USDC:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_send')
      ])
    }
  );
}

async function handleAmountInput(ctx: any, sendState: SendState) {
  const amount = ctx.message.text.trim();
  
  // Validate amount
  if (!isValidAmount(amount)) {
    await ctx.reply(
      '❌ Invalid amount format. Please enter a valid number (e.g., 100.50):',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_send')
      ])
    );
    return;
  }
  
  // Check if amount is too small
  if (parseFloat(amount) < 1) {
    await ctx.reply(
      '❌ Minimum send amount is 1 USDC. Please enter a larger amount:',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_send')
      ])
    );
    return;
  }
  
  // Store amount and move to network selection
  sendState.amount = amount;
  
  // If network is pre-selected, skip to confirmation
  if (sendState.network) {
    try {
      const fee = await getTransferFee(
        ctx.session.auth.accessToken, 
        amount,
        sendState.method === 'email' ? 'email' : 'wallet',
        sendState.network
      );
      
      sendState.fee = fee.toString();
      
      // Show confirmation with fee
      await showTransactionConfirmation(ctx);
    } catch (error) {
      console.error('Failed to get transfer fee:', error);
      
      // Proceed with confirmation anyway, but show warning
      sendState.fee = 'unknown';
      await showTransactionConfirmation(ctx, true);
    }
  } else {
    // Select network
    await selectNetwork(ctx);
  }
}

async function selectNetwork(ctx: any) {
  // Get available networks from wallets
  const wallets = ctx.session.send.wallets || [];
  
  if (wallets.length === 0) {
    await ctx.reply(
      '❌ No wallets available. Please set up your wallets on the Copperx web platform first.',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_send')
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
      `send_network:${wallet.network}`
    )];
  });
  
  // Add cancel button
  buttons.push([Markup.button.callback('Cancel', 'cancel_send')]);
  
  await ctx.reply(
    '🌐 *Select Source Network*\n\nChoose which network to send from:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    }
  );
}

async function showTransactionConfirmation(ctx: any, feeError = false) {
  const sendState = ctx.session.send;
  
  // Update step
  sendState.step = SendStep.CONFIRM_TRANSACTION;
  
  // Format network name
  const networkName = sendState.network?.charAt(0).toUpperCase() + sendState.network?.slice(1);
  
  // Calculate total amount with fee
  const amount = parseFloat(sendState.amount || '0');
  const fee = sendState.fee === 'unknown' ? 0 : parseFloat(sendState.fee || '0');
  const total = amount + fee;
  
  // Create confirmation message
  let message = '🔍 *Transaction Preview*\n\n';
  message += `*Send to:* ${sendState.recipient}\n`;
  message += `*Amount:* ${formatCurrency(amount)} USDC\n`;
  message += `*From Network:* ${networkName}\n`;
  
  if (feeError) {
    message += `*Fee:* Unable to calculate (will be deducted from amount)\n`;
  } else {
    message += `*Fee:* ${formatCurrency(fee)} USDC\n`;
    message += `*Total:* ${formatCurrency(total)} USDC\n`;
  }
  
  message += '\nPlease confirm this transaction:';
  
  await ctx.reply(
    message,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm and Send', 'confirm_send')],
        [Markup.button.callback('🔄 Change Network', 'select_network_again')],
        [Markup.button.callback('❌ Cancel', 'cancel_send')]
      ])
    }
  );
}

async function processTransaction(ctx: any) {
  const sendState = ctx.session.send;
  
  // Show processing message
  const loadingMsg = await ctx.reply('💳 Processing your transaction...');
  
  try {
    // Call API to send funds
    const result = await sendFunds(
      ctx.session.auth.accessToken,
      sendState.recipient!,
      sendState.amount!,
      sendState.network!,
      sendState.method === 'email' ? 'email' : 'wallet'
    );
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    // Show success message
    await ctx.reply(
      `✅ *Transaction Successful!*\n\n${formatCurrency(parseFloat(sendState.amount!))} USDC has been sent to ${sendState.recipient} from your ${sendState.network} wallet.\n\nTransaction ID: \`${result.transferId || 'Not available'}\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('View Balance', 'refresh_balance')],
          [Markup.button.callback('Send More', 'send_funds')],
          [Markup.button.callback('Back to Menu', 'main_menu')]
        ])
      }
    );
    
    // Clean up session
    delete ctx.session.send;
  } catch (error) {
    console.error('Transaction failed:', error);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    // Show error message
    await ctx.reply(
      `❌ *Transaction Failed*\n\nWe couldn't process your transaction. ${error.message || 'Please try again later.'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Try Again', 'send_funds')],
          [Markup.button.callback('Cancel', 'cancel_send')]
        ])
      }
    );
  }
}
