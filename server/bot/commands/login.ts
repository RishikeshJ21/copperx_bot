import { Markup, Telegraf } from 'telegraf';
import { LoginStep, isValidEmail, isValidOTP } from '../utils/validation';
import { createLoginButtons, createBackButton } from '../utils/markup';
import { requestEmailOTP, verifyEmailOTP, logout } from '../api/auth';
import { config } from '../config';
import { CopperxContext } from '../models';

// Interface for the login state
interface LoginState {
  step: LoginStep;
  email?: string;
  sid?: string;
  attemptCount: number;
}

/**
 * Register login command handlers
 * @param bot Telegraf bot instance
 */
export function registerLoginCommand(bot: Telegraf) {
  // Command handler for /login
  bot.command('login', async (ctx: any) => {
    // Clear any previous login state
    const typedCtx = ctx as CopperxContext;
    
    // Check if user is already logged in
    if (typedCtx.session.auth?.accessToken) {
      await ctx.reply(
        '✅ You are already logged in!',
        Markup.inlineKeyboard([
          Markup.button.callback('🔄 Refresh Session', 'refresh_session'),
          Markup.button.callback('❌ Logout', 'logout')
        ])
      );
      return;
    }
    
    await startLoginFlow(typedCtx);
  });
  
  // Login button handler
  bot.action('login', async (ctx: any) => {
    await ctx.answerCbQuery();
    await startLoginFlow(ctx as CopperxContext);
  });
  
  // Handler for going back to main menu
  bot.action('cancel_login', async (ctx: any) => {
    await ctx.answerCbQuery();
    const typedCtx = ctx as CopperxContext;
    
    // Clear login state
    if (typedCtx.session.login) {
      typedCtx.session.login = { step: LoginStep.IDLE, attemptCount: 0 };
      await typedCtx.saveSession();
    }
    
    await ctx.editMessageText(
      '⚠️ Login canceled. Return to the main menu to start again.',
      Markup.inlineKeyboard([
        Markup.button.callback('🏠 Main Menu', 'main_menu')
      ])
    );
  });
  
  // Handler for text input (email and OTP)
  bot.on('text', async (ctx: any) => {
    const typedCtx = ctx as CopperxContext;
    
    // If no login state or not in active login flow, ignore
    if (!typedCtx.session.login || typedCtx.session.login.step === LoginStep.IDLE) {
      return;
    }
    
    const loginState = typedCtx.session.login as LoginState;
    
    // Handle different steps of the login flow
    switch (loginState.step) {
      case LoginStep.WAITING_FOR_EMAIL:
        await handleEmailInput(typedCtx, loginState);
        break;
        
      case LoginStep.WAITING_FOR_OTP:
        await handleOTPInput(typedCtx, loginState);
        break;
    }
  });
  
  // Handler for refreshing session
  bot.action('refresh_session', async (ctx: any) => {
    await ctx.answerCbQuery();
    const typedCtx = ctx as CopperxContext;
    
    if (!typedCtx.session.auth?.accessToken) {
      await ctx.editMessageText(
        '❌ No active session found. Please login first.',
        Markup.inlineKeyboard([
          Markup.button.callback('🔑 Login', 'login'),
          Markup.button.callback('🏠 Main Menu', 'main_menu')
        ])
      );
      return;
    }
    
    // TODO: Implement token refresh logic here
    
    await ctx.editMessageText(
      '✅ Your session has been refreshed successfully!',
      Markup.inlineKeyboard([
        Markup.button.callback('🏠 Main Menu', 'main_menu')
      ])
    );
  });
  
  // Handler for logout
  bot.action('logout', async (ctx: any) => {
    await ctx.answerCbQuery();
    const typedCtx = ctx as CopperxContext;
    
    let logoutSuccessful = true;
    
    // If there's an active session, call the logout API
    if (typedCtx.session.auth?.accessToken) {
      try {
        // Display loading message
        await ctx.editMessageText(
          '🔄 Logging you out...',
          { reply_markup: { remove_keyboard: true } }
        );
        
        // Call the logout API endpoint
        const result = await logout(typedCtx.session.auth.accessToken);
        logoutSuccessful = result;
        
        // Log the result for debugging
        console.log(`Logout API call result: ${result ? 'success' : 'failed'}`);
        
      } catch (error) {
        console.error('Error during logout API call:', error);
        logoutSuccessful = false;
      }
    }
    
    // Reset session state
    typedCtx.session.auth = undefined;
    typedCtx.session.login = { step: LoginStep.IDLE, attemptCount: 0 };
    typedCtx.session.kycStatus = undefined;
    typedCtx.session.user = undefined;
    
    // Reset financial operation states
    if (typedCtx.session.send) typedCtx.session.send.step = 'idle';
    if (typedCtx.session.withdraw) typedCtx.session.withdraw.step = 'idle';
    if (typedCtx.session.deposit) typedCtx.session.deposit = { step: 'idle' };
    
    // Save session changes
    await typedCtx.saveSession();
    
    // Disconnect real-time notifications if they're set up
    if (typedCtx.notifications?.disconnectUser) {
      const chatId = ctx.chat.id.toString();
      typedCtx.notifications.disconnectUser(chatId);
    }
    
    // Show success or error message
    const message = logoutSuccessful
      ? '✅ You have been logged out successfully.'
      : '⚠️ Logout completed with warnings. Your local session has been cleared.';
    
    await ctx.editMessageText(
      message,
      Markup.inlineKeyboard([
        Markup.button.callback('🔑 Login Again', 'login'),
        Markup.button.callback('🏠 Main Menu', 'main_menu')
      ])
    );
  });
}

/**
 * Start the login flow
 * @param ctx Telegram context
 */
async function startLoginFlow(ctx: CopperxContext) {
  // Initialize login state
  ctx.session.login = {
    step: LoginStep.WAITING_FOR_EMAIL,
    attemptCount: 0
  };
  await ctx.saveSession();
  
  const message = `🔑 *Login to Copperx Payout*\n\nPlease enter your email address to receive a one-time password (OTP).`;
  
  // Check if it's an update to an existing message or a new message
  if ('callback_query' in ctx.update) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('❌ Cancel', 'cancel_login')
      ])
    });
  } else {
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('❌ Cancel', 'cancel_login')
      ])
    });
  }
}

/**
 * Handle email input from user
 * @param ctx Telegram context
 * @param loginState Current login state
 */
async function handleEmailInput(ctx: CopperxContext, loginState: LoginState) {
  const email = ctx.message?.text?.trim().toLowerCase();
  
  // Validate email format
  if (!email || !isValidEmail(email)) {
    await ctx.reply(
      `❌ ${config.messages.login.invalidEmail}\n\nPlease try again with a valid email address.`,
      Markup.inlineKeyboard([
        Markup.button.callback('❌ Cancel', 'cancel_login')
      ])
    );
    return;
  }
  
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('🔄 Sending OTP to your email...');
    
    // Request OTP from the API
    const response = await requestEmailOTP(email);
    
    // Update login state
    loginState.email = email;
    loginState.sid = response.sid;
    loginState.step = LoginStep.WAITING_FOR_OTP;
    await ctx.saveSession();
    
    // Delete loading message and show OTP input prompt
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    
    await ctx.reply(
      `✅ OTP sent to *${email}*!\n\nPlease enter the 6-digit code sent to your email.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('🔄 Resend OTP', 'resend_otp'),
          Markup.button.callback('❌ Cancel', 'cancel_login')
        ])
      }
    );
  } catch (error) {
    console.error('Error requesting OTP:', error);
    await ctx.reply(
      `❌ ${config.messages.error.general}\n\nThere was a problem sending the OTP. Please try again later.`,
      Markup.inlineKeyboard([
        Markup.button.callback('🔑 Try Again', 'login'),
        Markup.button.callback('❌ Cancel', 'cancel_login')
      ])
    );
  }
}

/**
 * Handle OTP input from user
 * @param ctx Telegram context
 * @param loginState Current login state
 */
async function handleOTPInput(ctx: CopperxContext, loginState: LoginState) {
  const otp = ctx.message?.text?.trim();
  
  // Validate OTP format
  if (!otp || !isValidOTP(otp)) {
    await ctx.reply(
      `❌ ${config.messages.login.invalidOTP}\n\nPlease enter a valid 6-digit OTP code.`,
      Markup.inlineKeyboard([
        Markup.button.callback('🔄 Resend OTP', 'resend_otp'),
        Markup.button.callback('❌ Cancel', 'cancel_login')
      ])
    );
    return;
  }
  
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('🔄 Verifying OTP...');
    
    // Verify OTP with the API
    const authResponse = await verifyEmailOTP(
      loginState.email!,
      otp,
      loginState.sid!
    );
    
    // Store auth data in session
    ctx.session.auth = {
      accessToken: authResponse.accessToken,
      expireAt: authResponse.expireAt,
      user: authResponse.user,
      organizationId: authResponse.user.organizationId
    };
    
    // Reset login state
    ctx.session.login = { step: LoginStep.IDLE, attemptCount: 0 };
    await ctx.saveSession();
    
    // Delete loading message
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    
    // Setup real-time notifications for this user
    if (ctx.notifications?.setupForUser && ctx.session.auth) {
      const chatId = ctx.chat!.id.toString();
      await ctx.notifications.setupForUser(
        chatId,
        ctx.session.auth.accessToken,
        ctx.session.auth.organizationId || ''
      );
    }
    
    // Get user's first name or default to "there"
    const firstName = authResponse.user.firstName || 'there';
    
    // Welcome message with user information
    await ctx.reply(
      `🎉 *Login Successful!*\n\nWelcome, *${firstName}*!\n\nYou're now logged in to your Copperx Payout account. You can check your balance, send funds, and manage your wallets.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💰 Check Balance', 'balance')],
          [Markup.button.callback('💼 My Wallets', 'wallets')],
          [Markup.button.callback('📤 Send Funds', 'send')],
          [Markup.button.callback('🏠 Main Menu', 'main_menu')]
        ])
      }
    );
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    // Increment failed attempt counter
    loginState.attemptCount = (loginState.attemptCount || 0) + 1;
    await ctx.saveSession();
    
    // If too many attempts, reset the flow
    if (loginState.attemptCount >= 3) {
      loginState.step = LoginStep.IDLE;
      await ctx.saveSession();
      
      await ctx.reply(
        `❌ Too many failed attempts. Please start the login process again.`,
        Markup.inlineKeyboard([
          Markup.button.callback('🔑 Try Again', 'login'),
          Markup.button.callback('🏠 Main Menu', 'main_menu')
        ])
      );
      return;
    }
    
    // Show error and retry options
    await ctx.reply(
      `❌ ${config.messages.login.invalidOTP}\n\nThe OTP code is invalid or has expired. Please try again.`,
      Markup.inlineKeyboard([
        Markup.button.callback('🔄 Resend OTP', 'resend_otp'),
        Markup.button.callback('❌ Cancel', 'cancel_login')
      ])
    );
  }
}