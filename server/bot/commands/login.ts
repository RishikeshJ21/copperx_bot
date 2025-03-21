import { Telegraf, Markup, Scenes, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { requestEmailOTP, verifyEmailOTP } from '../api/auth';
import { storage } from '../../storage';
import { isValidEmail } from '../utils/validation';

// Define login steps
enum LoginStep {
  IDLE = 'idle',
  WAITING_FOR_EMAIL = 'waiting_for_email',
  WAITING_FOR_OTP = 'waiting_for_otp',
}

// Define login state for session
interface LoginState {
  step: LoginStep;
  email?: string;
  sid?: string;
  attemptCount: number;
}

export function registerLoginCommand(bot: Telegraf) {
  // Handle /login command
  bot.command('login', async (ctx) => {
    // Reset login state
    ctx.session.login = {
      step: LoginStep.IDLE,
      attemptCount: 0,
    };
    
    await startLoginFlow(ctx);
  });
  
  // Also handle the keyboard button
  bot.hears('🔑 Login', async (ctx) => {
    ctx.session.login = {
      step: LoginStep.IDLE,
      attemptCount: 0,
    };
    
    await startLoginFlow(ctx);
  });
  
  // Handle email input
  bot.on(message('text'), async (ctx) => {
    const loginState = ctx.session.login as LoginState;
    
    // Skip if not in login flow
    if (!loginState || loginState.step === LoginStep.IDLE) {
      return;
    }
    
    if (loginState.step === LoginStep.WAITING_FOR_EMAIL) {
      await handleEmailInput(ctx, loginState);
    } else if (loginState.step === LoginStep.WAITING_FOR_OTP) {
      await handleOTPInput(ctx, loginState);
    }
  });
  
  // Handle cancel button
  bot.action('cancel_login', async (ctx) => {
    await ctx.answerCbQuery();
    delete ctx.session.login;
    await ctx.reply(
      'Login process canceled. You can restart by using the /login command.',
      Markup.removeKeyboard()
    );
  });
  
  // Handle resend OTP button
  bot.action('resend_otp', async (ctx) => {
    await ctx.answerCbQuery();
    const loginState = ctx.session.login as LoginState;
    
    if (!loginState || !loginState.email) {
      await ctx.reply('Login session expired. Please use /login to start again.');
      return;
    }
    
    try {
      const response = await requestEmailOTP(loginState.email);
      loginState.sid = response.sid;
      
      await ctx.reply(
        `A new OTP code has been sent to ${loginState.email}. Please enter it below:`,
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
}

// Helper functions
async function startLoginFlow(ctx: any) {
  await ctx.reply(
    '*Login to Your Copperx Account*\n\nPlease enter your email address to receive a one-time password:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Cancel', 'cancel_login')
      ])
    }
  );
  
  ctx.session.login.step = LoginStep.WAITING_FOR_EMAIL;
}

async function handleEmailInput(ctx: any, loginState: LoginState) {
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
  loginState.email = email;
  
  // Show loading message
  const loadingMsg = await ctx.reply('Sending OTP code to your email...');
  
  try {
    // Request OTP from API
    const response = await requestEmailOTP(email);
    loginState.sid = response.sid;
    
    // Update state to wait for OTP
    loginState.step = LoginStep.WAITING_FOR_OTP;
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
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
    await ctx.deleteMessage(loadingMsg.message_id);
    
    await ctx.reply(
      'Error sending OTP. Please check your email and try again.',
      Markup.inlineKeyboard([
        Markup.button.callback('Try Again', 'resend_otp'),
        Markup.button.callback('Cancel', 'cancel_login')
      ])
    );
  }
}

async function handleOTPInput(ctx: any, loginState: LoginState) {
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
    const authResponse = await verifyEmailOTP(loginState.email!, otp, loginState.sid!);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    // Store auth info in session
    ctx.session.auth = {
      accessToken: authResponse.accessToken,
      expireAt: new Date(authResponse.expireAt),
      user: authResponse.user,
      organizationId: authResponse.user.organizationId,
    };
    
    // Store session in database for persistence
    const telegramId = ctx.from.id.toString();
    
    // Check if user exists
    let user = await storage.getUser(telegramId);
    
    if (!user) {
      // Create new user
      user = await storage.createUser({
        telegramId,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
        email: loginState.email,
      });
    } else {
      // Update existing user
      await storage.updateUser(telegramId, {
        email: loginState.email,
      });
    }
    
    // Store or update session
    let session = await storage.getSession(telegramId);
    
    if (session) {
      await storage.updateSession(telegramId, {
        accessToken: authResponse.accessToken,
        expireAt: new Date(authResponse.expireAt),
        organizationId: authResponse.user.organizationId,
      });
    } else {
      await storage.createSession({
        telegramId,
        accessToken: authResponse.accessToken,
        expireAt: new Date(authResponse.expireAt),
        organizationId: authResponse.user.organizationId,
        sid: loginState.sid,
        state: {},
      });
    }
    
    // Clear login state
    delete ctx.session.login;
    
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
    await ctx.deleteMessage(loadingMsg.message_id);
    
    loginState.attemptCount += 1;
    
    if (loginState.attemptCount >= 3) {
      await ctx.reply(
        'Too many failed attempts. Please restart the login process.',
        Markup.removeKeyboard()
      );
      delete ctx.session.login;
    } else {
      await ctx.reply(
        `Invalid OTP code. Please try again (${loginState.attemptCount}/3 attempts):`,
        Markup.inlineKeyboard([
          Markup.button.callback('Resend Code', 'resend_otp'),
          Markup.button.callback('Cancel', 'cancel_login')
        ])
      );
    }
  }
}
