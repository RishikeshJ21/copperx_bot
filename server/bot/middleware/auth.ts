import { Context, Middleware } from 'telegraf';
import { createLoginButtons } from '../utils/markup';
import { config } from '../config';
import { CopperxContext } from '../models';
import { getUserProfile, checkTokenValidity } from '../api/auth';
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
    
    // Token is fully expired, force re-login
    if (expireAt <= now) {
      console.log('Token expired, forcing re-login');
      ctx.session.auth = undefined;
      await ctx.saveSession();
      
      await ctx.reply(
        '🔒 Your session has expired. Please log in again.',
        createLoginButtons()
      );
      return;
    }
    
    // If token is close to expiring but not yet expired, we'll still let this request through
    // But we'll log it for visibility - in a real-world scenario, we might implement token refresh
    if (expireAt.getTime() - now.getTime() < config.auth.tokenExpiryBuffer * 1000) {
      console.log(`Token for user ${ctx.from?.id} is nearing expiration`);
    }
  }
  
  // We'll limit API validation checks to save on API calls
  // Only validate when:
  // 1. No recent validation 
  // 2. Randomly with 10% chance for general validation
  // 3. For financial operations like send, withdraw
  
  const commandRequiresValidation = 
    ctx.update?.message?.text?.startsWith('/send') || 
    ctx.update?.message?.text?.startsWith('/withdraw') ||
    ctx.update?.message?.text?.startsWith('/deposit');
  
  const randomCheck = Math.random() < 0.1; // 10% chance of checking
  const lastCheck = ctx.session.lastTokenValidationTime || 0;
  const timeNow = Date.now();
  const timeSinceLastCheck = timeNow - lastCheck;
  const needsCheck = timeSinceLastCheck > 10 * 60 * 1000; // Check at least every 10 minutes
  
  if (commandRequiresValidation || randomCheck || needsCheck) {
    // Validate token by checking with API
    console.log(`Validating token for user ${ctx.from?.id}`);
    const isValid = await checkTokenValidity(ctx.session.auth.accessToken);
    
    if (!isValid) {
      // Token is invalid or expired according to the API
      console.log('Token validation failed, clearing session');
      ctx.session.auth = undefined;
      await ctx.saveSession();
      
      await ctx.reply(
        '🔒 Your session is invalid. Please log in again.',
        createLoginButtons()
      );
      return;
    }
    
    // Update the last validation time
    ctx.session.lastTokenValidationTime = timeNow;
    await ctx.saveSession();
  }
  
  // Only check KYC status for the /send command - per user request
  if (ctx.update?.message?.text?.startsWith('/send')) {
    try {
      // Make sure we have user email
      if (!ctx.session.auth.user?.email) {
        throw new Error('Missing user email for KYC check');
      }
      
      // Check KYC status
      const kycStatus = await getKycStatus(ctx.session.auth.accessToken, ctx.session.auth.user.email);
      
      // Store KYC status in session
      ctx.session.kycStatus = kycStatus;
      await ctx.saveSession();
      
      // If KYC is not verified, restrict access to send money
      if (kycStatus.status !== KycStatusType.VERIFIED) {
        // Define status-specific messages
        const statusMessages: Record<string, string> = {
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