import { MiddlewareFn } from 'telegraf';
import { CopperxContext } from '../models';
import { getKycStatus } from '../api/kyc';
import { KycStatusType } from '../models/kyc';
import { formatKycStatus } from '../utils/format';
import { createLoginButtons } from '../utils/markup';

/**
 * Cache duration for KYC status in milliseconds (5 minutes)
 */
const KYC_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Features that are always accessible regardless of KYC status
 */
const ALWAYS_ACCESSIBLE_FEATURES = [
  'start', 'help', 'login', 'logout', 'profile', 
  'balance', 'wallets', 'deposit', 'kyc'
];

/**
 * Features that require KYC verification
 */
const KYC_REQUIRED_FEATURES = [
  'send', 'withdraw', 'history', 'transfer'
];

/**
 * Check if the feature requires KYC verification
 * @param featureName Feature to check
 * @returns True if the feature requires KYC verification
 */
function requiresKycVerification(featureName: string): boolean {
  // Convert feature name to lowercase for case-insensitive comparison
  const feature = featureName.toLowerCase();
  
  // Always allow these features regardless of KYC status
  if (ALWAYS_ACCESSIBLE_FEATURES.some(f => feature.includes(f.toLowerCase()))) {
    return false;
  }
  
  // These features require KYC verification
  if (KYC_REQUIRED_FEATURES.some(f => feature.includes(f.toLowerCase()))) {
    return true;
  }
  
  // Default to requiring KYC for unknown features (security-first approach)
  return true;
}

/**
 * Middleware to check if user's KYC is verified for access to protected features
 * If not verified, blocks access and prompts for KYC completion
 */
export const requireKycVerification: MiddlewareFn<CopperxContext> = async (ctx, next) => {
  // Skip KYC check if user is not authenticated
  if (!ctx.session?.auth?.accessToken) {
    return next();
  }
  
  // Determine what feature is being accessed based on command or action
  const command = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const action = ctx.callbackQuery?.data || '';
  const featureName = command || action || '';
  
  // If this feature doesn't require KYC verification, proceed
  if (!requiresKycVerification(featureName)) {
    return next();
  }
  
  try {
    // Check if we need to refresh the cached KYC status
    const now = new Date();
    const lastCacheTime = ctx.session.lastCacheTime?.kyc;
    const shouldRefresh = !lastCacheTime || 
      (now.getTime() - lastCacheTime.getTime() > KYC_CACHE_DURATION);
    
    // If KYC status is not cached or cache is expired, fetch it
    if (shouldRefresh || !ctx.session.kycStatus) {
      const userEmail = ctx.session.auth.user?.email;
      if (!userEmail) {
        throw new Error('User email not found in session');
      }
      
      // Get KYC status from API
      const kycStatus = await getKycStatus(ctx.session.auth.accessToken, userEmail);
      ctx.session.kycStatus = kycStatus;
      
      // Update cache timestamp
      ctx.session.lastCacheTime = {
        ...ctx.session.lastCacheTime,
        kyc: now
      };
      
      await ctx.saveSession();
    }
    
    // Check if KYC is verified
    const status = ctx.session.kycStatus?.status?.toLowerCase();
    
    // Only allow access if KYC is verified
    if (status === KycStatusType.VERIFIED.toLowerCase()) {
      return next();
    }
    
    // If KYC is not verified, show appropriate message
    let message = '⚠️ *KYC Verification Required*\n\n';
    
    if (!status || status === KycStatusType.NOT_STARTED.toLowerCase()) {
      message += 'You need to complete KYC verification to access this feature. Please complete the verification process to unlock all features.';
    } else if (status === KycStatusType.PENDING.toLowerCase()) {
      message += 'Your KYC verification is pending. This feature will be unlocked once your verification is approved.';
    } else if (status === KycStatusType.REJECTED.toLowerCase()) {
      message += 'Your KYC verification was rejected. Please resubmit your verification details.';
    } else if (status === KycStatusType.EXPIRED.toLowerCase()) {
      message += 'Your KYC verification has expired. Please complete the verification process again.';
    }
    
    // Add KYC status information
    message += `\n\nCurrent Status: ${formatKycStatus(status)}`;
    
    // Add next steps if available
    if (ctx.session.kycStatus?.nextSteps?.length) {
      message += '\n\nNext Steps:';
      ctx.session.kycStatus.nextSteps.forEach((step: string) => {
        message += `\n• ${step}`;
      });
    }
    
    // Add a KYC command hint
    message += '\n\nUse /kyc to start the verification process or check your status.';
    
    // Send message with KYC button
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: createLoginButtons().reply_markup
    });
    
    // Don't proceed to the next middleware
    return;
  } catch (error) {
    console.error('Error checking KYC status:', error);
    
    // In case of error, log it but allow the user to proceed
    // This prevents locking users out completely if the KYC service is down
    return next();
  }
};

/**
 * Middleware to check and warn about KYC status but not block access
 * This is useful for gently reminding users about KYC requirements
 */
export const suggestKycVerification: MiddlewareFn<CopperxContext> = async (ctx, next) => {
  // Skip if user is not authenticated
  if (!ctx.session?.auth?.accessToken) {
    return next();
  }
  
  try {
    // Check if KYC status is cached and still valid
    const now = new Date();
    const lastCacheTime = ctx.session.lastCacheTime?.kyc;
    const shouldRefresh = !lastCacheTime || 
      (now.getTime() - lastCacheTime.getTime() > KYC_CACHE_DURATION);
    
    // If KYC status is not cached or cache is expired, fetch it
    if (shouldRefresh || !ctx.session.kycStatus) {
      const userEmail = ctx.session.auth.user?.email;
      if (!userEmail) {
        throw new Error('User email not found in session');
      }
      
      // Get KYC status from API
      const kycStatus = await getKycStatus(ctx.session.auth.accessToken, userEmail);
      ctx.session.kycStatus = kycStatus;
      
      // Update cache timestamp
      ctx.session.lastCacheTime = {
        ...ctx.session.lastCacheTime,
        kyc: now
      };
      
      await ctx.saveSession();
    }
    
    // Determine the current KYC status
    const status = ctx.session.kycStatus?.status?.toLowerCase();
    
    // If KYC is already verified, just proceed
    if (status === KycStatusType.VERIFIED.toLowerCase()) {
      return next();
    }
    
    // For non-verified users, show a gentle reminder but allow them to proceed
    // This is for features that don't strictly require KYC but we want to encourage it
    await ctx.reply('ℹ️ *Reminder*: Some Copperx features require KYC verification. Use /kyc to check your verification status.', {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error checking KYC status:', error);
  }
  
  // Always proceed to the next middleware
  return next();
};