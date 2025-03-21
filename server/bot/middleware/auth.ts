import { Context, Middleware } from 'telegraf';
import { createLoginButtons } from '../utils/markup';
import { config } from '../config';

/**
 * Middleware to check if user's session is authenticated and token is valid
 */
export const requireAuth: Middleware<Context> = async (ctx, next) => {
  const typedCtx = ctx as any;
  
  // Check if user has an active session
  if (!typedCtx.session || !typedCtx.session.auth || !typedCtx.session.auth.accessToken) {
    await ctx.reply(
      config.messages.error.auth,
      createLoginButtons()
    );
    return;
  }
  
  // Check if token is expired
  if (typedCtx.session.auth.expireAt) {
    const expireAt = new Date(typedCtx.session.auth.expireAt);
    const now = new Date();
    const bufferTime = config.auth.tokenExpiryBuffer; // 5 minute buffer
    
    if (expireAt.getTime() - now.getTime() < bufferTime) {
      // Token is expired or about to expire
      await ctx.reply(
        config.messages.error.timeout,
        createLoginButtons()
      );
      
      // Clear the expired session
      typedCtx.session.auth = null;
      await typedCtx.saveSession();
      return;
    }
  }
  
  // Proceed to the next middleware/handler
  return next();
};

/**
 * Middleware to suggest login if user is not authenticated
 * Unlike requireAuth, this middleware doesn't block the request
 */
export const suggestAuth: Middleware<Context> = async (ctx, next) => {
  const typedCtx = ctx as any;
  
  // Check if user has an active session
  if (!typedCtx.session || !typedCtx.session.auth || !typedCtx.session.auth.accessToken) {
    await ctx.reply(
      '👋 To access all features, please login to your Copperx account first.',
      createLoginButtons()
    );
  }
  
  // Always proceed to the next middleware/handler
  return next();
};

/**
 * Middleware to clear user flow state
 * This is useful for resetting the state of multi-step commands
 */
export const clearFlowState: Middleware<Context> = async (ctx, next) => {
  const typedCtx = ctx as any;
  
  if (typedCtx.session) {
    // Reset command-specific states
    typedCtx.session.login = {
      step: 'idle',
      attemptCount: 0
    };
    
    typedCtx.session.send = {
      step: 'idle'
    };
    
    typedCtx.session.withdraw = {
      step: 'idle'
    };
    
    // Save the cleared session
    await typedCtx.saveSession();
  }
  
  // Proceed to the next middleware/handler
  return next();
};