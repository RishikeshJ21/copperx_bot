# Copperx Payout Telegram Bot Documentation

## Overview

The Copperx Payout Telegram Bot is a sophisticated application that enables Copperx users to manage their stablecoin finances through the Telegram messaging platform. This bot serves as an interface between users and the Copperx Payout platform, allowing for seamless account management, fund transfers, balance checking, and other banking operations.

**Primary Use Case:** Enable users to manage their stablecoin finances directly from Telegram without needing to access the web platform.

## Core Features

### 1. Authentication
- **Email-based OTP Authentication** - Secure login using email and one-time passwords
- **Token Management** - Automatic token refresh and persistence
- **Session Management** - Long-lived sessions with secure storage

### 2. Wallet Management
- **Balance Checking** - View wallet balances across different networks
- **Multiple Wallet Support** - Access to all wallets associated with the user's account
- **Default Wallet Setting** - Ability to set preferred wallets for operations

### 3. Transfers & Transactions
- **Send Funds** - Transfer funds to other users via email or wallet address
- **Withdraw** - Withdraw funds to external wallets or bank accounts
- **Deposit** - Get deposit instructions with QR codes for wallet addresses
- **Transaction History** - View detailed transaction history with filtering options

### 4. KYC Verification
- **Status Checking** - Check current KYC verification status
- **Feature Gating** - Restricted access to features based on KYC status
- **Verification Guidance** - Instructions for completing KYC verification

### 5. Notifications
- **Real-time Updates** - Receive notifications about transactions and account activity
- **Custom Alerts** - Configurable notification preferences
- **Pusher Integration** - Real-time updates using Pusher websockets

### 6. Referral & Points System
- **Points Display** - View current points balance
- **Referral Code Management** - Get and share personal referral codes
- **Rewards Tracking** - Monitor rewards from successful referrals

## Technical Architecture

### System Architecture

The Copperx Telegram Bot follows a modular architecture optimized for maintainability and extensibility:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Telegram API   │ ◄────► │  Bot Application  │ ◄────► │  Copperx API    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     ▲
                                     │
                                     ▼
                             ┌──────────────────┐
                             │  Local Storage   │
                             └──────────────────┘
```

- **Frontend:** Telegram Chat Interface
- **Backend:** Node.js/TypeScript server with Telegraf framework
- **Storage:** In-memory with persistence options
- **External Integration:** Copperx Payout API, Pusher notifications

### Code Structure

The project follows a well-organized folder structure:

```
/
├── server/
│   ├── bot/
│   │   ├── api/              # API integration with Copperx services
│   │   ├── commands/         # Bot command implementations
│   │   ├── middleware/       # Request processing middleware
│   │   ├── models/           # Data models and type definitions
│   │   ├── scenes/           # Wizard scenes for multi-step operations
│   │   ├── utils/            # Utility functions
│   │   ├── config.ts         # Configuration settings
│   │   └── index.ts          # Bot initialization and setup
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes definition
│   ├── storage.ts            # Storage implementation
│   └── vite.ts               # Development server configuration
├── shared/
│   └── schema.ts             # Shared data schemas
├── start-bot.ts              # Standalone bot entry point
├── run-bot.js                # Bot runner script
├── replit-start.js           # Replit environment startup script
└── telegram-bot.ts           # Legacy bot implementation
```

### Key Components

#### 1. Bot Framework
- Uses **Telegraf.js** for Telegram Bot API interactions
- Implements a scene-based approach for complex multi-step operations
- Utilizes middleware for authentication, authorization, and session management

#### 2. Command System
- Comprehensive command handlers for all bot functionalities
- Structured menu system for easy navigation
- Admin commands for bot management and monitoring

#### 3. Session Management
- Custom session implementation with persistence
- Memory-based session storage with database options
- Secure token storage and automatic refresh

#### 4. Scene Wizards
- Interactive guided workflows for complex operations
- State management for multi-step processes
- Form validation and error handling

#### 5. API Integration
- Secure communication with Copperx Payout API
- Token-based authentication
- Rate limiting and error handling

#### 6. Notification System
- Pusher integration for real-time updates
- Configurable notification preferences
- Support for transaction alerts and system notifications

## Technical Details

### Dependencies

- **telegraf**: Telegram Bot framework
- **axios**: HTTP client for API requests
- **date-fns**: Date utilities
- **dotenv**: Environment variable management
- **pusher-js**: Real-time notifications
- **typescript**: Type safety and developer experience

### Configuration

The bot uses a centralized configuration system in `server/bot/config.ts`, which includes:

- API endpoints and timeouts
- Bot metadata
- Authentication parameters
- Rate limits and pagination
- Notification settings
- Message templates

### Data Models

Key data models include:

1. **User**: User profile and authentication information
2. **Session**: Authentication tokens and session data
3. **Wallet**: Wallet addresses and balances
4. **Transfer**: Transaction details and status
5. **KYC**: Verification status and requirements

### Authentication Flow

1. User initiates `/login` command
2. Bot prompts for email address
3. Copperx API sends OTP to user's email
4. User enters OTP in Telegram
5. Bot verifies OTP with Copperx API
6. On success, bot stores authentication token in session
7. Session persists between bot restarts

### KYC Verification System

- KYC status is checked on startup and cached
- Middleware enforces KYC requirements for protected commands
- Features are progressively unlocked as KYC levels increase
- Basic features (balance, profile, deposit) are available without KYC
- Advanced features (send, withdraw) require full verification

### Command Handlers

Commands are structured in the `server/bot/commands/` directory:

- **start.ts**: Initial bot interaction
- **login.ts**: Authentication flow
- **balance.ts**: Check wallet balances
- **wallets.ts**: Wallet management
- **send.ts**: Send funds to others
- **withdraw.ts**: Withdraw funds to external accounts
- **deposit.ts**: Get deposit instructions
- **history.ts**: View transaction history
- **kyc.ts**: KYC status and verification
- **profile.ts**: User profile management
- **points.ts**: Referral program and points
- **help.ts**: Help and documentation
- **admin.ts**: Admin-only commands
- **menu.ts**: Menu navigation
- **index.ts**: Command registration

### Middleware Stack

The middleware pipeline includes:

1. **Session**: Handle user session persistence
2. **Authentication**: Verify user is authenticated
3. **KYC Verification**: Check and enforce KYC requirements
4. **Error Handling**: Global error catching and reporting
5. **Admin Check**: Identify administrator access
6. **Flow State**: Manage multi-step command flows

### Scene-based Wizards

Complex operations are implemented as wizard scenes:

- **Balance Scene**: Interactive balance display with wallet details
- **Send Scene**: Multi-step send funds process
- **Withdraw Scene**: Guided withdrawal process with method selection
- **Deposit Scene**: Network selection and deposit instructions
- **Account Scene**: Bank account management

### Real-time Notifications

The notification system uses Pusher to provide real-time updates:

- **Transaction Updates**: Notifications when transactions change status
- **Deposit Alerts**: Alerts when new deposits are received
- **System Notifications**: Important system messages and updates

## Deployment

### Environment Variables

Key environment variables include:

- `TELEGRAM_BOT_TOKEN`: Bot token from BotFather
- `TELEGRAM_WEBHOOK_DOMAIN`: (Optional) Domain for webhook mode
- `TELEGRAM_WEBHOOK_PATH`: (Optional) Path for webhook endpoint
- `TELEGRAM_WEBHOOK_SECRET`: (Optional) Secret for webhook security
- `COPPERX_API_URL`: Base URL for Copperx API
- `NODE_ENV`: Environment (development/production)

### Running Modes

The bot supports two operational modes:

1. **Long Polling Mode**: Default mode, actively polls Telegram for updates
2. **Webhook Mode**: Receives updates via webhooks (requires public HTTPS endpoint)

### Hosting Options

- **Replit**: Current deployment platform
- **Heroku**: Alternative cloud platform
- **AWS/GCP/Azure**: Enterprise deployment options
- **Self-hosted**: For maximum control and security

## Development Workflow

### Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Create `.env` file with required environment variables
4. Run in development mode with `node run-bot.js`

### Adding New Features

1. Define data models in appropriate files under `models/`
2. Implement API integration in `api/` directory
3. Create command handler in `commands/` directory
4. Register command in `commands/index.ts`
5. For complex multi-step flows, create a scene in `scenes/` directory

### Best Practices

- Use TypeScript for all new code
- Follow the existing folder structure and naming conventions
- Add comprehensive error handling
- Document all functions and interfaces
- Write modular, testable code
- Consider UX implications of new features
- Test thoroughly with real Telegram clients

## Future Enhancements

### Planned Features

- **Multi-language Support**: Internationalization for global users
- **Enhanced Referral System**: Improved referral tracking and rewards
- **Advanced Analytics**: Detailed usage statistics and reporting
- **Enhanced Security**: Additional security features like 2FA
- **Custom Keyboards**: Rich interface elements for improved UX

### Technical Improvements

- **Database Storage**: Move from memory storage to persistent database
- **Caching Layer**: Implement caching for API responses
- **Testing Framework**: Comprehensive test suite
- **CI/CD Pipeline**: Automated testing and deployment
- **Monitoring & Alerting**: Production monitoring with alerts

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Usually related to expired tokens
2. **API Connectivity**: Network issues or API endpoint changes
3. **Rate Limiting**: Hitting Telegram API rate limits
4. **Webhook Configuration**: Incorrect domain or SSL issues
5. **Session Persistence**: Issues with session storage

### Debugging

- Check logs for error messages
- Verify environment variables
- Test API endpoints directly
- Check Telegram Bot API status
- Verify webhook configuration (if using webhooks)

## Resources

- [Copperx Payout API Documentation](https://income-api.copperx.io/docs)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegraf Framework Documentation](https://telegraf.js.org/)
- [Pusher Documentation](https://pusher.com/docs)
- [GitHub Repository](https://github.com/RishikeshJ21/copperx_bot)

## Support

For issues or questions, contact:
- **Technical Support**: [support@copperx.io](mailto:support@copperx.io)
- **Bot Admin**: [@Rish_w3b](https://t.me/Rish_w3b)
