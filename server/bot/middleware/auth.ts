import { Context, Middleware } from 'telegraf';
import { createLoginButtons } from '../utils/markup';
import { config } from '../config';
import { CopperxContext } from '../models';
import { getUserProfile } from '../api/auth';
import { getKycStatus } from '../api/kyc';
import { KycStatusType } from '../models/kyc';

/**
 * Middleware to check if user's session is authenticated and token is valid
 */
export const requireAuth: Middleware<CopperxContext> = async (ctx, next) => {
  // Check if user has an active session
  if (!ctx.session || !ctx.session.auth || !ctx.session.auth.accessToken) {
    await ctx.reply(
      config.messages.error.auth,
      createLoginButtons()
    );
    return;
  }
  
  // Check if token is expired
  if (ctx.session.auth.expireAt) {
    const expireAt = new Date(ctx.session.auth.expireAt);
    const now = new Date();
    const bufferTime = config.auth.tokenExpiryBuffer * 1000; // Convert seconds to milliseconds
    
    if (expireAt.getTime() - now.getTime() < bufferTime) {
      // Token is expired or about to expire
      await ctx.reply(
        '🔒 Your session has expired. Please log in again.',
        createLoginButtons()
      );
      
      // Clear the expired session
      ctx.session.auth = undefined;
      await ctx.saveSession();
      return;
    }
  }
  
  // Validate token by making a quick profile call
  try {
    if (ctx.update.message?.text && !ctx.update.message.text.startsWith('/kyc')) {
      await getUserProfile(ctx.session.auth.accessToken);
    }
  } catch (error) {
    console.error('Token validation failed:', error);
    
    // Clear invalid session
    ctx.session.auth = undefined;
    await ctx.saveSession();
    
    await ctx.reply(
      '🔒 Your session is invalid. Please log in again.',
      createLoginButtons()
    );
    return;
  }
  
  // Only check KYC status for financial operations
  if (ctx.update.message && ['/send', '/withdraw', '/deposit', '/wallets', '/balance'].some(cmd => 
      ctx.update.message?.text?.startsWith(cmd))) {
    try {
      // Check KYC status first
      const kycStatus = await getKycStatus(ctx.session.auth.accessToken, ctx.session.auth.user.email);
      
      // Store KYC status in session
      ctx.session.kycStatus = kycStatus;
      await ctx.saveSession();
      
      // If KYC is not verified, restrict access to these commands
      if (kycStatus.status !== KycStatusType.VERIFIED) {
        const statusMessages = {
          [KycStatusType.NOT_STARTED]: '❗ You need to complete KYC verification before using this feature. Use /kyc to start the verification process.',
          [KycStatusType.PENDING]: '⏳ Your KYC verification is still being processed. You\'ll get access to this feature once your verification is approved.',
          [KycStatusType.REJECTED]: '❌ Your KYC verification was rejected. Use /kyc to view the reason and resubmit your verification.',
          [KycStatusType.EXPIRED]: '⚠️ Your KYC verification has expired. Please use /kyc to renew your verification.'
        };
        
        const message = statusMessages[kycStatus.status] || 'You need to complete KYC verification to use this feature.';
        
        await ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Check KYC Status', callback_data: 'refresh_kyc' }],
              [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
            ]
          }
        });
        return;
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error);
      // Allow to proceed even if KYC check fails, but log the error
    }
  }
  
  // Proceed to the next middleware/handler
  return next();
};

/**
 * Middleware to suggest login if user is not authenticated
 * Unlike requireAuth, this middleware doesn't block the request
 */
export const suggestAuth: Middleware<CopperxContext> = async (ctx, next) => {
  // First proceed to the next middleware to handle the request
  await next();
  
  // Then suggest login if user isn't logged in
  if (!ctx.session || !ctx.session.auth || !ctx.session.auth.accessToken) {
    await ctx.reply(
      '👋 To access all features, please login to your Copperx account first.',
      createLoginButtons()
    );
  }
};

/**
 * Middleware to clear user flow state
 * This is useful for resetting the state of multi-step commands
 */
export const clearFlowState: Middleware<CopperxContext> = async (ctx, next) => {
  if (ctx.session) {
    // Reset command-specific states
    if (ctx.session.login) {
      ctx.session.login = {
        step: 'idle',
        attemptCount: 0
      };
    }
    
    if (ctx.session.send) {
      ctx.session.send = {
        step: 'idle'
      };
    }
    
    if (ctx.session.withdraw) {
      ctx.session.withdraw = {
        step: 'idle'
      };
    }
    
    // Save the cleared session
    await ctx.saveSession();
  }
  
  // Proceed to the next middleware/handler
  return next();
};