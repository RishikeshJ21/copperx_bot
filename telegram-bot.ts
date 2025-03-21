import { Telegraf, session, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import axios from 'axios';

// Configuration
const config = {
  // Telegram bot token
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '7390840940:AAFV1hAeh5LZTadeVbhCRlbRUx2pW1cSVoU',
  
  // API configuration
  apiBaseUrl: process.env.API_BASE_URL || 'https://income-api.copperx.io',
  
  // Debug mode
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production',
  
  // Supported networks
  supportedNetworks: ['polygon', 'solana', 'ethereum'],
};

// Session store
const sessions = new Map();

// Utility function for formatting currency values
function formatCurrency(value: number, decimals: number = 2): string {
  if (isNaN(value)) {
    return '0.00';
  }
  
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Utility function for truncating wallet addresses
function truncateWithEllipsis(str: string, startChars: number = 6, endChars: number = 4): string {
  if (!str) {
    return '';
  }
  
  if (str.length <= startChars + endChars) {
    return str;
  }
  
  return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
}

// Utility function for validating email addresses
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Login steps
enum LoginStep {
  IDLE = 'idle',
  WAITING_FOR_EMAIL = 'waiting_for_email',
  WAITING_FOR_OTP = 'waiting_for_otp',
}

// Request email OTP for authentication
async function requestEmailOTP(email: string): Promise<{ email: string; sid: string }> {
  try {
    const response = await axios.post(
      `${config.apiBaseUrl}/api/auth/email-otp/request`,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to request email OTP:', error);
    throw new Error(error.response?.data?.message || 'Failed to send OTP to email');
  }
}

// Verify email OTP
async function verifyEmailOTP(
  email: string,
  otp: string,
  sid: string
): Promise<any> {
  try {
    const response = await axios.post(
      `${config.apiBaseUrl}/api/auth/email-otp/authenticate`,
      { email, otp, sid },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to verify email OTP:', error);
    throw new Error(error.response?.data?.message || 'Invalid OTP code');
  }
}

// Get wallet balances
async function getWalletBalances(accessToken: string) {
  try {
    const response = await axios.get(
      `${config.apiBaseUrl}/api/wallets/balances`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    return response.data.items || [];
  } catch (error) {
    console.error('Failed to get wallet balances:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch wallet balances');
  }
}

// Get transaction history
async function getTransferHistory(
  accessToken: string,
  page: number = 1,
  limit: number = 5,
  type?: string
) {
  try {
    let url = `${config.apiBaseUrl}/api/transfers?page=${page}&limit=${limit}`;
    
    if (type && type !== 'all') {
      url += `&type=${type}`;
    }
    
    const response = await axios.get(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to get transfer history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch transfer history');
  }
}

// Get KYC status
async function getKycStatus(accessToken: string, email: string) {
  try {
    // Encode email address for URL
    const encodedEmail = encodeURIComponent(email);
    
    const response = await axios.get(
      `${config.apiBaseUrl}/api/kycs/status/${encodedEmail}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to get KYC status:', error);
    throw new Error(error.response?.data?.message || 'Failed to check KYC status');
  }
}

// Initialize bot
console.log('Initializing Telegram bot...');
const bot = new Telegraf(config.telegramToken);

// Set up session middleware with basic memory storage
bot.use(session({
  defaultSession: () => ({
    messages: [],
  })
}));

// Debug logging
if (config.debug) {
  bot.use((ctx, next) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const text = ctx.message?.text;
    if (text) {
      console.log(`[${userId}:@${username}] ${text}`);
    }
    return next();
  });
}

// Command: Start
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
      ['🔑 Login'],
      ['❓ Help']
    ]).resize()
  });
});

// Command: Help
bot.command('help', async (ctx) => {
  const helpMessage = `
*Copperx Payout Bot - Help Menu* 📚

*Available Commands:*
/start - Start the bot and get welcome message
/login - Log in to your Copperx account
/balance - View your wallet balances
/wallets - Manage your wallets
/send - Send funds to email or wallet address
/withdraw - Withdraw to external wallet or bank
/deposit - Get deposit address for a network
/history - View transaction history
/kyc - Check KYC verification status
/profile - View and update your profile
/help - Show this help menu
/logout - Log out from your account

For additional assistance, please contact Copperx support.
`;

  await ctx.reply(helpMessage, {
    parse_mode: 'Markdown'
  });
});

// Login command
bot.command('login', async (ctx) => {
  // Store session info
  sessions.set(ctx.from.id, {
    loginStep: LoginStep.WAITING_FOR_EMAIL,
    attemptCount: 0
  });
  
  await ctx.reply(
    '*Login to Your Copperx Account*\n\nPlease enter your email address to receive a one-time password:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_login')
      ])
    }
  );
});

// Handle the login keyboard button
bot.hears('🔑 Login', async (ctx) => {
  // Store session info
  sessions.set(ctx.from.id, {
    loginStep: LoginStep.WAITING_FOR_EMAIL,
    attemptCount: 0
  });
  
  await ctx.reply(
    '*Login to Your Copperx Account*\n\nPlease enter your email address to receive a one-time password:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_login')
      ])
    }
  );
});

// Handle text messages for login flow
bot.on(message('text'), async (ctx) => {
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  
  // Skip if not in login flow
  if (!session || session.loginStep === LoginStep.IDLE) {
    return;
  }
  
  if (session.loginStep === LoginStep.WAITING_FOR_EMAIL) {
    const email = ctx.message.text.trim();
    
    if (!isValidEmail(email)) {
      await ctx.reply(
        'Invalid email format. Please enter a valid email address:',
        Markup.inlineKeyboard([
          Markup.button.callback('Cancel', 'cancel_login')
        ])
      );
      return;
    }
    
    // Store email in session
    session.email = email;
    
    // Show loading message
    const loadingMsg = await ctx.reply('Sending OTP code to your email...');
    
    try {
      // Request OTP from API
      const response = await requestEmailOTP(email);
      session.sid = response.sid;
      
      // Update state to wait for OTP
      session.loginStep = LoginStep.WAITING_FOR_OTP;
      
      // Update session
      sessions.set(userId, session);
      
      // Delete loading message
      await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
      
      // Ask user for OTP
      await ctx.reply(
        `We've sent a verification code to *${email}*. Please enter the code below:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('Resend Code', 'resend_otp'),
            Markup.button.callback('Cancel', 'cancel_login')
          ])
        }
      );
    } catch (error) {
      console.error('Failed to request OTP:', error);
      
      // Delete loading message
      await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
      
      await ctx.reply(
        'Error sending OTP. Please check your email and try again.',
        Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'resend_otp'),
          Markup.button.callback('Cancel', 'cancel_login')
        ])
      );
    }
  } else if (session.loginStep === LoginStep.WAITING_FOR_OTP) {
    const otp = ctx.message.text.trim();
    
    if (!otp || otp.length < 4) {
      await ctx.reply(
        'Invalid OTP format. Please enter the verification code you received:',
        Markup.inlineKeyboard([
          Markup.button.callback('Resend Code', 'resend_otp'),
          Markup.button.callback('Cancel', 'cancel_login')
        ])
      );
      return;
    }
    
    // Show loading message
    const loadingMsg = await ctx.reply('Verifying OTP code...');
    
    try {
      // Verify OTP from API
      const authResponse = await verifyEmailOTP(session.email, otp, session.sid);
      
      // Delete loading message
      await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
      
      // Store auth info in session
      session.auth = {
        accessToken: authResponse.accessToken,
        expireAt: new Date(authResponse.expireAt),
        user: authResponse.user,
        organizationId: authResponse.user.organizationId,
      };
      
      // Clear login state
      session.loginStep = LoginStep.IDLE;
      
      // Update session
      sessions.set(userId, session);
      
      // Send success message with main menu
      await ctx.reply(
        `*Login Successful!* ✅\n\nWelcome back, ${authResponse.user.firstName || 'User'}! You're now connected to your Copperx account.\n\nUse the keyboard menu below to navigate:`,
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard([
            ['💰 Balance', '👛 Wallets'],
            ['📤 Send', '📥 Deposit'],
            ['📋 History', '👤 Profile'],
            ['💼 KYC Status', '❓ Help']
          ]).resize()
        }
      );
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      
      // Delete loading message
      await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
      
      session.attemptCount += 1;
      
      if (session.attemptCount >= 3) {
        await ctx.reply(
          'Too many failed attempts. Please restart the login process.',
          Markup.removeKeyboard()
        );
        sessions.delete(userId);
      } else {
        // Update session
        sessions.set(userId, session);
        
        await ctx.reply(
          `Invalid OTP code. Please try again (${session.attemptCount}/3 attempts):`,
          Markup.inlineKeyboard([
            Markup.button.callback('Resend Code', 'resend_otp'),
            Markup.button.callback('Cancel', 'cancel_login')
          ])
        );
      }
    }
  }
});

// Cancel login button
bot.action('cancel_login', async (ctx) => {
  await ctx.answerCbQuery();
  sessions.delete(ctx.from.id);
  await ctx.reply(
    'Login process canceled. You can restart by using the /login command.',
    Markup.removeKeyboard()
  );
});

// Resend OTP button
bot.action('resend_otp', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  
  if (!session || !session.email) {
    await ctx.reply('Login session expired. Please use /login to start again.');
    return;
  }
  
  try {
    const response = await requestEmailOTP(session.email);
    session.sid = response.sid;
    
    // Update session
    sessions.set(userId, session);
    
    await ctx.reply(
      `A new OTP code has been sent to ${session.email}. Please enter it below:`,
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_login')
      ])
    );
  } catch (error) {
    console.error('Failed to resend OTP:', error);
    await ctx.reply(
      'Error sending OTP. Please try again later or restart the login process.',
      Markup.inlineKeyboard([
        Markup.button.callback('Try Again', 'resend_otp'),
        Markup.button.callback('Cancel', 'cancel_login')
      ])
    );
  }
});

// Balance command
bot.command('balance', async (ctx) => {
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  
  if (!session || !session.auth) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nYou need to log in to use this feature. Please use /login to authenticate with your Copperx account.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Show loading message
  const loadingMsg = await ctx.reply('Loading your balances...');
  
  try {
    const wallets = await getWalletBalances(session.auth.accessToken);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    
    if (!wallets || wallets.length === 0) {
      await ctx.reply(
        '💼 *No Wallets Found*\n\nYou don\'t have any wallets yet. Please create one via the web portal.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Calculate total balance
    let totalBalance = 0;
    wallets.forEach(wallet => {
      totalBalance += parseFloat(wallet.balance || '0');
    });
    
    // Format response
    let response = `💰 *Your Wallet Balances*\n\n*Total: ${formatCurrency(totalBalance)} USDC*\n\n`;
    
    wallets.forEach(wallet => {
      const networkName = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
      const balance = parseFloat(wallet.balance || '0');
      const isDefault = wallet.isDefault ? ' (Default)' : '';
      
      response += `*${networkName}${isDefault}*: ${formatCurrency(balance)} USDC\n`;
      
      if (wallet.address) {
        response += `Address: \`${truncateWithEllipsis(wallet.address)}\`\n`;
      }
      
      response += '\n';
    });
    
    response += 'Use /wallets to see more details and options.';
    
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('🔄 Refresh', 'refresh_balance')
      ])
    });
  } catch (error) {
    console.error('Failed to fetch balances:', error);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    
    await ctx.reply(
      '❌ *Error Fetching Balances*\n\nCould not retrieve your wallet balances. Please try again later.',
      { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'refresh_balance')
        ])
      }
    );
  }
});

// Refresh balance button
bot.action('refresh_balance', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await commands.balance(ctx);
});

// Handle keyboard balance button
bot.hears('💰 Balance', async (ctx) => {
  await commands.balance(ctx);
});

// Transaction history command
bot.command('history', async (ctx) => {
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  
  if (!session || !session.auth) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nYou need to log in to use this feature. Please use /login to authenticate with your Copperx account.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Show loading message
  const loadingMsg = await ctx.reply('Loading your transaction history...');
  
  try {
    // Get transfer history from API
    const history = await getTransferHistory(session.auth.accessToken);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    
    if (!history || !history.items || history.items.length === 0) {
      await ctx.reply(
        '📋 *No Transactions Found*\n\nYou don\'t have any transaction history yet.',
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('🔄 Refresh', 'refresh_history')
          ])
        }
      );
      return;
    }
    
    // Format response
    let response = `📋 *Your Transaction History*\n\n`;
    
    history.items.forEach((transfer, index) => {
      const date = new Date(transfer.createdAt).toLocaleDateString();
      const amount = formatCurrency(parseFloat(transfer.amount || '0'));
      const status = transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1);
      let type = transfer.type.charAt(0).toUpperCase() + transfer.type.slice(1);
      
      if (transfer.direction === 'in') {
        type = `${type} (Received)`;
      } else if (transfer.direction === 'out') {
        type = `${type} (Sent)`;
      }
      
      let recipient = '';
      if (transfer.recipientEmail) {
        recipient = ` to ${transfer.recipientEmail}`;
      } else if (transfer.walletAddress) {
        recipient = ` to ${truncateWithEllipsis(transfer.walletAddress)}`;
      }
      
      response += `*${index + 1}. ${type}${recipient}*\n`;
      response += `Amount: ${amount} USDC\n`;
      response += `Status: ${status}\n`;
      response += `Date: ${date}\n`;
      
      if (index < history.items.length - 1) {
        response += '\n—————————————\n\n';
      }
    });
    
    // Add pagination info
    if (history.total > history.items.length) {
      const totalPages = Math.ceil(history.total / history.items.length);
      response += `\n\nShowing page 1 of ${totalPages}`;
    }
    
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('All', 'filter_history:all'),
          Markup.button.callback('Deposits', 'filter_history:deposit'),
          Markup.button.callback('Withdrawals', 'filter_history:withdraw')
        ],
        [
          Markup.button.callback('🔄 Refresh', 'refresh_history')
        ]
      ])
    });
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    
    await ctx.reply(
      '❌ *Error Fetching History*\n\nCould not retrieve your transaction history. Please try again later.',
      { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'refresh_history')
        ])
      }
    );
  }
});

// Refresh history button
bot.action('refresh_history', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await commands.history(ctx);
});

// Filter history buttons
bot.action(/filter_history:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const filter = ctx.match[1];
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  
  if (!session || !session.auth) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nYou need to log in to use this feature. Please use /login to authenticate with your Copperx account.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Show loading message
  const loadingMsg = await ctx.reply('Filtering transaction history...');
  
  try {
    // Get filtered transfer history from API
    const history = await getTransferHistory(
      session.auth.accessToken,
      1,
      5,
      filter === 'all' ? undefined : filter
    );
    
    // Delete loading message and original message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    await ctx.deleteMessage().catch(err => console.error('Failed to delete message:', err));
    
    if (!history || !history.items || history.items.length === 0) {
      await ctx.reply(
        `📋 *No ${filter === 'all' ? 'Transactions' : filter.charAt(0).toUpperCase() + filter.slice(1) + 's'} Found*\n\nNo matching transactions in your history.`,
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('All', 'filter_history:all'),
              Markup.button.callback('Deposits', 'filter_history:deposit'),
              Markup.button.callback('Withdrawals', 'filter_history:withdraw')
            ],
            [
              Markup.button.callback('🔄 Refresh', 'refresh_history')
            ]
          ])
        }
      );
      return;
    }
    
    // Format response
    let response = `📋 *Your ${filter === 'all' ? 'Transaction' : filter.charAt(0).toUpperCase() + filter.slice(1)} History*\n\n`;
    
    history.items.forEach((transfer, index) => {
      const date = new Date(transfer.createdAt).toLocaleDateString();
      const amount = formatCurrency(parseFloat(transfer.amount || '0'));
      const status = transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1);
      let type = transfer.type.charAt(0).toUpperCase() + transfer.type.slice(1);
      
      if (transfer.direction === 'in') {
        type = `${type} (Received)`;
      } else if (transfer.direction === 'out') {
        type = `${type} (Sent)`;
      }
      
      let recipient = '';
      if (transfer.recipientEmail) {
        recipient = ` to ${transfer.recipientEmail}`;
      } else if (transfer.walletAddress) {
        recipient = ` to ${truncateWithEllipsis(transfer.walletAddress)}`;
      }
      
      response += `*${index + 1}. ${type}${recipient}*\n`;
      response += `Amount: ${amount} USDC\n`;
      response += `Status: ${status}\n`;
      response += `Date: ${date}\n`;
      
      if (index < history.items.length - 1) {
        response += '\n—————————————\n\n';
      }
    });
    
    // Add pagination info
    if (history.total > history.items.length) {
      const totalPages = Math.ceil(history.total / history.items.length);
      response += `\n\nShowing page 1 of ${totalPages}`;
    }
    
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            filter === 'all' ? '✓ All' : 'All', 
            'filter_history:all'
          ),
          Markup.button.callback(
            filter === 'deposit' ? '✓ Deposits' : 'Deposits', 
            'filter_history:deposit'
          ),
          Markup.button.callback(
            filter === 'withdraw' ? '✓ Withdrawals' : 'Withdrawals', 
            'filter_history:withdraw'
          )
        ],
        [
          Markup.button.callback('🔄 Refresh', 'refresh_history')
        ]
      ])
    });
  } catch (error) {
    console.error('Failed to fetch filtered history:', error);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    
    await ctx.reply(
      '❌ *Error Filtering History*\n\nCould not retrieve filtered transaction history. Please try again later.',
      { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'refresh_history')
        ])
      }
    );
  }
});

// Handle keyboard history button
bot.hears('📋 History', async (ctx) => {
  await commands.history(ctx);
});

// KYC Status command
bot.command('kyc', async (ctx) => {
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  
  if (!session || !session.auth) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nYou need to log in to use this feature. Please use /login to authenticate with your Copperx account.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Show loading message
  const loadingMsg = await ctx.reply('Checking your KYC status...');
  
  try {
    // Get KYC status from API
    const kycStatus = await getKycStatus(session.auth.accessToken, session.auth.user.email);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    
    // Format KYC status
    let statusEmoji = '❓';
    let statusLabel = 'Unknown';
    
    switch (kycStatus.status?.toLowerCase()) {
      case 'verified':
        statusEmoji = '✅';
        statusLabel = 'Verified';
        break;
      case 'pending':
        statusEmoji = '⏳';
        statusLabel = 'Pending';
        break;
      case 'rejected':
        statusEmoji = '❌';
        statusLabel = 'Rejected';
        break;
      case 'not_started':
      case 'notstarted':
        statusEmoji = '🆕';
        statusLabel = 'Not Started';
        break;
      case 'expired':
        statusEmoji = '⚠️';
        statusLabel = 'Expired';
        break;
    }
    
    // Create response message
    let response = `💼 *KYC Verification Status*\n\n`;
    response += `Status: ${statusEmoji} ${statusLabel}\n`;
    
    if (kycStatus.level) {
      response += `Level: ${kycStatus.level}\n`;
    }
    
    if (kycStatus.verificationDate) {
      const date = new Date(kycStatus.verificationDate).toLocaleDateString();
      response += `Verified on: ${date}\n`;
    }
    
    if (kycStatus.limits) {
      response += '\n*Transaction Limits:*\n';
      
      if (kycStatus.limits.daily) {
        response += `Daily: ${formatCurrency(kycStatus.limits.daily)} USDC\n`;
      }
      
      if (kycStatus.limits.monthly) {
        response += `Monthly: ${formatCurrency(kycStatus.limits.monthly)} USDC\n`;
      }
      
      if (kycStatus.limits.perTransaction) {
        response += `Per Transaction: ${formatCurrency(kycStatus.limits.perTransaction)} USDC\n`;
      }
    }
    
    if (kycStatus.rejectionReason) {
      response += `\n*Rejection Reason:* ${kycStatus.rejectionReason}\n`;
    }
    
    if (kycStatus.nextSteps && kycStatus.nextSteps.length > 0) {
      response += '\n*Next Steps:*\n';
      kycStatus.nextSteps.forEach((step, index) => {
        response += `${index + 1}. ${step}\n`;
      });
    }
    
    if (kycStatus.status !== 'verified') {
      response += '\nComplete your KYC verification to unlock all platform features.';
    }
    
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.url(
            'Complete Verification', 
            'https://payout.copperx.io/settings/kyc'
          )
        ],
        [
          Markup.button.callback('🔄 Refresh Status', 'refresh_kyc')
        ]
      ])
    });
  } catch (error) {
    console.error('Failed to fetch KYC status:', error);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(err => console.error('Failed to delete message:', err));
    
    await ctx.reply(
      '❌ *Error Checking KYC Status*\n\nCould not retrieve your verification status. Please try again later.',
      { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'refresh_kyc')
        ])
      }
    );
  }
});

// Refresh KYC button
bot.action('refresh_kyc', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await commands.kyc(ctx);
});

// Handle keyboard KYC button
bot.hears('💼 KYC Status', async (ctx) => {
  await commands.kyc(ctx);
});

// Set up command handlers
const commands = {
  balance: async (ctx: any) => {
    // Call the balance command handler
    await ctx.reply('Loading your balances...');
    // Balance command implementation would go here
  },
  history: async (ctx: any) => {
    // Call the history command handler
    await ctx.reply('Loading your transaction history...');
    // History command implementation would go here
  },
  kyc: async (ctx: any) => {
    // Call the KYC command handler
    await ctx.reply('Checking your KYC status...');
    // KYC command implementation would go here
  }
};

// Note: We're using the commands object directly rather than adding to context

// Start the bot
bot.launch()
  .then(() => {
    console.log('✅ Telegram bot started successfully');
    if (bot.botInfo) {
      console.log(`Bot username: @${bot.botInfo.username}`);
    } else {
      console.log('Bot is running but bot info is not available yet');
    }
  })
  .catch(err => {
    console.error('Failed to start bot:', err);
  });

// Handle graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));