/**
 * Bot configuration
 * Centralizes all configuration values for easy management
 */
export const config = {
  api: {
    baseURL: 'https://income-api.copperx.io',
    timeout: 15000, // 15 seconds timeout for API requests
  },
  bot: {
    name: 'Copperx Payout Bot',
    description: 'Manage your Copperx payouts and transfers through Telegram',
  },
  auth: {
    tokenExpiryBuffer: 300, // 5 minutes buffer before token expires
    otpLength: 6, // OTP is 6 digits
    maxLoginAttempts: 3, // Maximum attempts for OTP verification
    sessionTimeoutMinutes: 60 * 24 * 7, // 7 days session lifetime
  },
  limits: {
    transfersPerPage: 5, // Number of transfers to show per page
    maxTransactionAmount: 10000, // Maximum amount for a single transaction
    minWithdrawalAmount: 1, // Minimum amount for withdrawal
    maxWithdrawalAmount: 1000, // Maximum amount for withdrawal
  },
  notifications: {
    enabled: true,
    polling: {
      interval: 60 * 1000, // 1 minute polling interval
    },
  },
  messages: {
    welcome: 'Welcome to Copperx Payout Bot! 🚀\n\nI can help you manage your stablecoin payouts, check balances, and make transfers. Please use /login to get started or /help to see available commands.',
    help: {
      main: 'Here are the commands you can use:\n\n/start - Start the bot\n/login - Log in to your account\n/balance - Check your wallet balance\n/wallets - Manage your wallets\n/send - Send funds to a recipient\n/withdraw - Withdraw funds to a wallet or bank\n/deposit - Get deposit instructions\n/history - View transaction history\n/kyc - Check KYC status\n/profile - View your profile\n/help - Show this help message\n\nUse /help wallets or /help transfers for more specific information.',
    },
    error: {
      general: 'Sorry, an error occurred. Please try again later.',
      auth: 'You need to log in first. Use /login to authenticate.',
      timeout: 'The operation timed out. Please try again.',
      invalidInput: 'Invalid input. Please try again.',
    },
    login: {
      start: 'Please enter your email address to receive a one-time password (OTP):',
      invalidEmail: 'The email format is invalid. Please enter a valid email address:',
      emailSent: 'We\'ve sent a verification code to %EMAIL%. Please enter the 6-digit code:',
      invalidOTP: 'Invalid verification code. Please try again:',
      tooManyAttempts: 'Too many failed attempts. Please try again later.',
      success: 'Login successful! You are now authenticated. Use /help to see available commands.',
      emailNotFound: 'Email not found. Please check and try again, or contact support.',
    }
  }
};