# Copperx Payout Telegram Bot

![Copperx Logo](generated-icon.png)

A Telegram bot for the Copperx Payout platform, enabling seamless stablecoin financial management through a user-friendly interface.

## 📋 Overview

Copperx Payout Telegram Bot allows users to interact with the Copperx Payout platform directly through Telegram, making stablecoin transfers, deposits, withdrawals, and account management more accessible and convenient.

## 🚀 Features

- **🔐 Authentication**: Secure login via email OTP verification
- **💰 Wallet Management**: View balances, set default wallets, deposit funds
- **💸 Fund Transfers**: Send funds to email addresses or external wallets
- **🏦 Withdrawals**: Withdraw to external wallets or bank accounts
- **📊 Transaction History**: View and filter transaction history
- **📝 KYC Verification**: Check KYC status and unlock features
- **🔔 Real-time Notifications**: Get notified about deposits and transfers
- **⭐ Referral System**: Earn and track points through the referral program

## 🛠️ Technical Architecture

### Core Components

The project is organized into the following key components:

1. **Bot Core (`telegram-bot.ts`, `start-bot.ts`)**
   - Bot initialization and configuration
   - Command registration and routing
   - Main entry points and workflows

2. **API Integration (`server/bot/api/`)**
   - Handles communication with Copperx Payout API
   - Organized by feature (auth, wallet, transfer, etc.)
   - Implements proper error handling and response parsing

3. **Command Handlers (`server/bot/commands/`)**
   - Implements command-specific logic
   - Organizes user interaction flows
   - Maps user inputs to API calls

4. **Scenes/Wizards (`server/bot/scenes/`)**
   - Multi-step interactive workflows
   - Form-like experiences for complex operations
   - State management for user interactions

5. **Models (`server/bot/models/`)**
   - Type definitions and interfaces
   - Data structure organization
   - Shared types across components

6. **Utilities (`server/bot/utils/`)**
   - Formatting functions
   - Validation helpers
   - UI component builders

7. **Middleware (`server/bot/middleware/`)**
   - Authentication checks
   - KYC verification requirements
   - Session management

8. **Storage (`server/storage.ts`)**
   - Session and user data persistence
   - Credential management
   - Transaction history storage

### Authentication Flow

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐
│ /login   │────►│ Enter Email   │────►│ Request OTP   │
└──────────┘     └───────────────┘     └───────┬───────┘
                                              │
┌──────────┐     ┌───────────────┐     ┌──────▼───────┐
│ Success  │◄────│ Store Token   │◄────│ Verify OTP   │
└──────────┘     └───────────────┘     └──────────────┘
```

### Wallet & Transfer Flow

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐
│ /send    │────►│ Select Method │────►│ Enter Amount  │
└──────────┘     └───────────────┘     └───────┬───────┘
                                              │
┌──────────┐     ┌───────────────┐     ┌──────▼───────┐
│ Complete │◄────│ Process       │◄────│ Confirm      │
└──────────┘     └───────────────┘     └──────────────┘
```

## 📦 Code Organization

```
├── server
│   ├── bot
│   │   ├── api            # API integration modules
│   │   ├── commands       # Command handlers
│   │   ├── middleware     # Authentication & KYC middlewares
│   │   ├── models         # Type definitions & interfaces
│   │   ├── scenes         # Interactive wizard scenes
│   │   └── utils          # Utility functions
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route configuration
│   ├── storage.ts         # Data persistence
│   └── vite.ts            # Vite server configuration
├── shared
│   └── schema.ts          # Shared type definitions
├── telegram-bot.ts        # Main bot file
├── start-bot.ts           # Bot startup script
└── ...
```

## 🗃️ Major Code Components in Detail

### 1. Authentication System

- **Email OTP Authentication**: Implements a secure login flow using email and OTP verification
- **Token Management**: Stores and refreshes access tokens to maintain sessions
- **Session Persistence**: Maintains user state across bot restarts

```typescript
// Example: Email OTP Authentication Flow
async function verifyEmailOTP(email: string, otp: string, sid: string): Promise<any> {
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
```

### 2. Wallet Management

- **Balance Checking**: View wallet balances across networks
- **Wallet Operations**: Set default wallet, view details
- **Deposit Addresses**: Generate and display deposit instructions

```typescript
// Example: Get Wallet Balances
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
```

### 3. Fund Transfer System

- **Send to Email**: Send funds to any email address
- **Send to Wallet**: Send funds to external wallets
- **Withdraw to Bank**: Withdraw funds to bank accounts
- **Fee Calculation**: Show transaction fees before confirming

```typescript
// Example: Send Funds to Email
async function sendToEmail(accessToken: string, email: string, amount: string) {
  try {
    const response = await axios.post(
      `${config.apiBaseUrl}/api/transfers/send`,
      {
        email,
        amount,
        currency: 'USD',
        purposeCode: 'payment'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to send funds:', error);
    throw new Error(error.response?.data?.message || 'Failed to send funds');
  }
}
```

### 4. KYC Verification

- **Status Checking**: View current KYC status
- **Feature Restrictions**: Lock certain features until KYC is verified
- **KYC Guidance**: Provide instructions to complete KYC

```typescript
// Example: Check KYC Status
async function getKycStatus(accessToken: string, email: string) {
  try {
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
```

### 5. Transaction History

- **History Viewing**: See past transactions
- **Filtering**: Filter by transaction type
- **Pagination**: Navigate through transaction history

```typescript
// Example: Get Transaction History
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
```

### 6. Notification System

- **Pusher Integration**: Real-time notification via Pusher
- **Event Handling**: Process deposit and transfer events
- **User Notifications**: Send Telegram notifications for events

```typescript
// Example: Setup Pusher Notifications
async function setupUserNotifications(
  bot: Telegraf,
  telegramId: string | number,
  accessToken: string,
  organizationId: string
) {
  try {
    const pusherClient = createPusherClient(accessToken, organizationId);
    const channelName = `private-org-${organizationId}`;
    const channel = pusherClient.subscribe(channelName);
    
    channel.bind('deposit', (data: any) => {
      bot.telegram.sendMessage(
        telegramId, 
        `💰 *New Deposit Received*\n\n` +
        `${formatCurrency(Number(data.amount))} USDC deposited on ${data.network || 'your wallet'}\n\n` +
        `Use /balance to check your updated balance.`,
        { parse_mode: 'Markdown' }
      );
    });
    
    return { pusher: pusherClient, channel, channelName, organizationId };
  } catch (error) {
    console.error(`Failed to set up notifications for ${telegramId}:`, error);
    return null;
  }
}
```

### 7. Referral & Points System

- **Points Tracking**: View earned points
- **Referral Codes**: Share and apply referral codes
- **Points Breakdown**: See points from different sources

```typescript
// Example: Get Total Points
async function getTotalPoints(accessToken: string, email: string) {
  try {
    const response = await axios.get(
      `${config.apiBaseUrl}/api/points/total?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to get points:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch points');
  }
}
```

### 8. Interactive Command Scenes

- **Multi-step Flows**: Guide users through complex operations
- **State Management**: Track progress through multi-step processes
- **Form Validation**: Validate user inputs at each step

```typescript
// Example: Wizard Scene Setup (simplified)
function createWithdrawScene() {
  const scene = new Scenes.WizardScene(
    'withdraw',
    // Step 1: Select method
    async (ctx) => {
      await ctx.reply('Select withdrawal method:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'To Wallet', callback_data: 'withdraw_wallet' }],
            [{ text: 'To Bank', callback_data: 'withdraw_bank' }],
            [{ text: 'Cancel', callback_data: 'cancel_withdraw' }]
          ]
        }
      });
      return ctx.wizard.next();
    },
    
    // Step 2: Enter amount
    async (ctx) => {
      await ctx.reply('Enter amount to withdraw:');
      return ctx.wizard.next();
    },
    
    // Step 3: Confirm
    async (ctx) => {
      await ctx.reply('Confirm withdrawal?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Confirm', callback_data: 'confirm_withdraw' }],
            [{ text: 'Cancel', callback_data: 'cancel_withdraw' }]
          ]
        }
      });
      return ctx.wizard.next();
    }
  );
  
  return scene;
}
```

## 🚨 Error Handling

- **API Errors**: Graceful handling of API failures
- **User Input Validation**: Detailed error messages for invalid inputs
- **Connection Issues**: Retry mechanisms for network failures
- **Session Expiration**: Automatic re-login when sessions expire

## 🔒 Security Considerations

- **Token Management**: Secure storage of access tokens
- **Input Validation**: Sanitization of all user inputs
- **Error Messages**: Non-revealing error messages to users
- **Session Timeouts**: Automatic session expiration

## 📱 User Experience

- **Intuitive Commands**: Simple command structure
- **Keyboard Menus**: Interactive keyboard-based navigation
- **Guided Workflows**: Step-by-step guidance for complex operations
- **Clear Feedback**: Informative responses to user actions

## 📚 API Integration

The bot integrates with the following Copperx API endpoints:

- **Authentication**: `/api/auth/email-otp/request`, `/api/auth/email-otp/authenticate`
- **Wallet Management**: `/api/wallets`, `/api/wallets/balances`
- **Transfers**: `/api/transfers`, `/api/transfers/send`, `/api/transfers/wallet-withdraw`
- **KYC**: `/api/kycs/status`
- **Points**: `/api/points/total`, `/api/points/all`
- **Notifications**: `/api/notifications/auth`

## 🌐 Development & Deployment

### Environment Setup

Create a `.env` file with the following variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
API_BASE_URL=https://income-api.copperx.io
DEBUG=true
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
```

### Running the Bot

```bash
# For development
npm run start-bot

# For production
npm run start-bot-prod
```

## 📝 License

This project is proprietary and confidential. All rights reserved.

## 👥 Contact

For support or inquiries, please contact:
X: https://x.com/rish_w3b
