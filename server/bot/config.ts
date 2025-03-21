/**
 * Bot configuration
 * Centralizes all configuration values for easy management
 */
export const config = {
  // Bot configuration
  bot: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    username: process.env.TELEGRAM_BOT_USERNAME || 'CopperxPayoutBot',
    webhookDomain: process.env.TELEGRAM_WEBHOOK_DOMAIN || '',
    webhookPath: '/bot/webhook',
    defaultLanguage: 'en',
    admins: (process.env.BOT_ADMIN_IDS || '').split(',').filter(Boolean)
  },
  
  // API configuration
  api: {
    baseUrl: process.env.COPPERX_API_URL || 'https://api.copperx.io',
    timeout: 10000, // 10 seconds
    retries: 3
  },
  
  // Pusher configuration for real-time notifications
  pusher: {
    key: process.env.PUSHER_APP_KEY || '',
    cluster: process.env.PUSHER_CLUSTER || 'us2',
    authEndpoint: '/api/pusher/auth',
    encrypted: true,
    userPrefix: 'user-',
    orgPrefix: 'org-'
  },
  
  // Session configuration
  session: {
    ttl: 86400 * 30, // 30 days in seconds
    refreshInterval: 3600 * 12, // 12 hours in seconds
  },
  
  // Feature flags
  features: {
    kycEnabled: true,
    bridgingEnabled: true,
    bankWithdrawalsEnabled: true,
    notificationsEnabled: true,
    referralsEnabled: false
  },
  
  // Messaging configuration
  messages: {
    // Welcome message shown when user first starts the bot
    welcome: `👋 *Welcome to Copperx Payout*\n\nManage your stablecoin finances right from Telegram!\n\nYou can:\n• Check your balance\n• Send & receive funds\n• Deposit & withdraw\n• Manage your wallets\n• View transaction history\n\nTo get started, please login.`,
    
    // Error messages
    errors: {
      general: "Sorry, something went wrong. Please try again later.",
      login: "Sorry, there was a problem with login. Please try again.",
      invalidEmail: "Please enter a valid email address.",
      invalidOTP: "The OTP code is invalid. Please check and try again.",
      sessionExpired: "Your session has expired. Please login again.",
      unauthorized: "You need to login first to use this feature.",
      insufficientFunds: "You don't have enough funds for this transaction.",
      invalidAmount: "Please enter a valid amount.",
      invalidAddress: "Please enter a valid wallet address.",
      networkUnavailable: "This network is currently unavailable."
    },
    
    // Help messages
    help: {
      main: "Here's how to use the Copperx Payout bot:\n\n/start - Start the bot\n/login - Login to your account\n/balance - Check your balance\n/send - Send funds\n/withdraw - Withdraw funds\n/deposit - Get deposit address\n/history - View transaction history\n/wallets - Manage your wallets\n/kyc - Verify your identity\n/help - Show this help message",
      balance: "Use the /balance command to check your wallet balances across all supported networks.",
      send: "Use the /send command to send funds to another user via email or wallet address.",
      withdraw: "Use the /withdraw command to withdraw funds to an external wallet or bank account.",
      deposit: "Use the /deposit command to get deposit addresses for different networks.",
      wallets: "Use the /wallets command to view and manage your wallets.",
      kyc: "Use the /kyc command to verify your identity to increase transaction limits."
    }
  },
  
  // Networks
  networks: {
    supported: ['ethereum', 'solana', 'polygon', 'bsc', 'avalanche'],
    default: 'solana'
  },
  
  // Transaction limits
  limits: {
    minSend: '1',
    maxSend: '100000',
    minWithdraw: '10',
    maxWithdraw: '50000',
    minDeposit: '1'
  }
};