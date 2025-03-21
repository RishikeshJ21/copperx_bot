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
      Markup.button.callback('👤 Profile', 'profile')
    ],
    [
      Markup.button.callback('🆔 KYC', 'kyc'),
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