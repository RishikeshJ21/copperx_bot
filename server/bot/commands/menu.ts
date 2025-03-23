
import { Markup } from 'telegraf';
import { CopperxContext } from '../models';

/**
 * Display main menu
 * @param ctx Telegram context
 */
export async function showMainMenu(ctx: CopperxContext): Promise<void> {
  const buttons = [
    [
      Markup.button.callback('💰 Balance', 'balance'),
      Markup.button.callback('⬆️ Deposit', 'deposit')
    ],
    [
      Markup.button.callback('⬇️ Withdraw', 'withdraw'),
      Markup.button.callback('💸 Send', 'send')
    ],
    [
      Markup.button.callback('📊 History', 'history'),
      Markup.button.callback('🏆 Points', 'points_menu')
    ],
    [
      Markup.button.callback('👤 Profile', 'profile'),
      Markup.button.callback('🆔 KYC', 'kyc')
    ],
    [
      Markup.button.callback('ℹ️ Help', 'help')
    ]
  ];

  const isLoggedIn = !!ctx.session.auth?.accessToken;
  if (!isLoggedIn) {
    buttons.unshift([Markup.button.callback('🔑 Login', 'login')]);
  } else {
    buttons.push([Markup.button.callback('🚪 Logout', 'logout')]);
  }

  const welcomeMessage = isLoggedIn
    ? `*Welcome back to Copperx*\n\nWhat would you like to do today?`
    : `*Welcome to Copperx*\n\nPlease login to access your account, or explore our features below.`;

  // Check if this is a callback query (button click)
  if (ctx.callbackQuery) {
    await ctx.editMessageText(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    }).catch(() => {
      // If editing fails (e.g. message is too old), send a new message
      ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    });
  } else {
    // For direct commands like /start
    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }
}

/**
 * Display profile menu
 */
export async function showProfileMenu(ctx: CopperxContext): Promise<void> {
  const user = ctx.session.auth?.user;
  if (!user) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nPlease login to view your profile.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('🔑 Login', 'login')]]
        }
      }
    );
    return;
  }

  const profileInfo = `
*👤 Profile Information*

Name: ${user.firstName} ${user.lastName || ''}
Email: ${user.email}
Account Type: ${user.type || 'Standard'}
Organization: ${user.organizationId ? 'Yes' : 'No'}
KYC Status: ${user.kycStatus || 'Not Verified'}

Use the buttons below to manage your profile:
`;

  await ctx.reply(profileInfo, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          Markup.button.callback('📝 Edit Profile', 'edit_profile'),
          Markup.button.callback('🔐 Security', 'security')
        ],
        [
          Markup.button.callback('⬅️ Back to Menu', 'main_menu')
        ]
      ]
    }
  });
}

/**
 * Display help menu
 */
export async function showHelpMenu(ctx: CopperxContext): Promise<void> {
  const helpMessage = `
*ℹ️ Help & Support*

*Available Commands:*
/start - Open main menu
/login - Login to your account
/balance - Check your balances
/send - Send USDC to others
/deposit - Get deposit addresses
/withdraw - Withdraw funds
/history - View transaction history
/profile - View your profile
/kyc - Check KYC status
/help - Show this help menu

*Need Support?*
• Visit our support center: https://support.copperx.io
• Contact us: support@copperx.io

Choose an option below:
`;

  await ctx.reply(helpMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          Markup.button.callback('📖 FAQ', 'faq'),
          Markup.button.callback('📞 Contact', 'contact')
        ],
        [
          Markup.button.callback('⬅️ Back to Menu', 'main_menu')
        ]
      ]
    }
  });
}

/**
 * Show deposit instructions
 */
export async function showDepositMenu(ctx: CopperxContext): Promise<void> {
  if (!ctx.session.auth?.accessToken) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nPlease login to view deposit options.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('🔑 Login', 'login')]]
        }
      }
    );
    return;
  }

  const depositMessage = `
*⬆️ Deposit USDC*

Select a network to receive your deposit address:

*Supported Networks:*
• Polygon (MATIC)
• Solana (SOL)
• Ethereum (ETH)

Choose a network below:
`;

  await ctx.reply(depositMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          Markup.button.callback('Polygon', 'deposit_polygon'),
          Markup.button.callback('Solana', 'deposit_solana')
        ],
        [
          Markup.button.callback('Ethereum', 'deposit_ethereum')
        ],
        [
          Markup.button.callback('⬅️ Back to Menu', 'main_menu')
        ]
      ]
    }
  });
}

/**
 * Show withdrawal options
 */
export async function showWithdrawMenu(ctx: CopperxContext): Promise<void> {
  if (!ctx.session.auth?.accessToken) {
    await ctx.reply(
      '🔒 *Authentication Required*\n\nPlease login to withdraw funds.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('🔑 Login', 'login')]]
        }
      }
    );
    return;
  }

  const withdrawMessage = `
*⬇️ Withdraw USDC*

Choose your withdrawal method:

*Available Options:*
• Crypto withdrawal to external wallet
• Bank transfer (requires KYC)

Select an option below:
`;

  await ctx.reply(withdrawMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          Markup.button.callback('💼 Crypto Wallet', 'withdraw_crypto'),
          Markup.button.callback('🏦 Bank Transfer', 'withdraw_bank')
        ],
        [
          Markup.button.callback('⬅️ Back to Menu', 'main_menu')
        ]
      ]
    }
  });
}
