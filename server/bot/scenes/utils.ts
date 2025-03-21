import { Markup } from 'telegraf';
import { CopperxContext } from '../models';
import { MARKUP_CONFIG, DEFAULT_MESSAGES } from './config';

/**
 * Scene utility functions
 * Contains shared utilities for scenes
 */

/**
 * Creates a back or cancel button for scenes
 * @param action Action for the button (e.g., 'main_menu', 'cancel_send')
 * @param isCancel If true, uses cancel text instead of back
 * @returns Markup with back/cancel button
 */
export function createSceneNavigation(action: string, isCancel = false) {
  const buttonText = isCancel ? MARKUP_CONFIG.CANCEL_TEXT : MARKUP_CONFIG.BACK_TEXT;
  return Markup.inlineKeyboard([
    [Markup.button.callback(buttonText, action)]
  ]);
}

/**
 * Creates confirmation buttons for scenes
 * @param confirmAction Action for confirm button
 * @param cancelAction Action for cancel button
 * @returns Markup with confirm and cancel buttons
 */
export function createSceneConfirmation(confirmAction: string, cancelAction: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(MARKUP_CONFIG.CONFIRM_TEXT, confirmAction),
      Markup.button.callback(MARKUP_CONFIG.CANCEL_TEXT, cancelAction)
    ]
  ]);
}

/**
 * End a scene and return to main menu
 * @param ctx Telegram context
 * @param message Optional message to show (defaults to cancelled message)
 * @returns Promise resolving when scene exits
 */
export async function exitScene(ctx: CopperxContext, message?: string) {
  await ctx.reply(
    message || DEFAULT_MESSAGES.CANCELLED,
    createSceneNavigation('main_menu')
  );
  return await ctx.scene.leave();
}

/**
 * Handle authentication check within a scene
 * @param ctx Telegram context
 * @param onAuthenticated Callback to run if authenticated
 * @returns Promise resolving when auth check completes
 */
export async function handleSceneAuth(
  ctx: CopperxContext, 
  onAuthenticated: () => Promise<void>
) {
  if (!ctx.session.auth?.accessToken) {
    await ctx.reply(
      DEFAULT_MESSAGES.UNAUTHORIZED,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔑 Login', 'login')]
      ])
    );
    return await ctx.scene.leave();
  }
  
  return await onAuthenticated();
}

/**
 * Safely access wizard state
 * Helper to avoid null/undefined errors when accessing wizard state
 * @param ctx Telegram context
 * @returns Wizard state object
 */
export function getWizardState<T>(ctx: CopperxContext): T {
  return (ctx.wizard.state || {}) as T;
}

/**
 * Format error message for user-friendly display
 * @param error Error object or message
 * @returns Formatted error message
 */
export function formatErrorMessage(error: any): string {
  if (!error) return DEFAULT_MESSAGES.ERROR;
  
  if (typeof error === 'string') {
    return `❌ Error: ${error}`;
  }
  
  // Check for common API error formats
  if (error.response?.data?.message) {
    return `❌ ${error.response.data.message}`;
  }
  
  if (error.message) {
    return `❌ ${error.message}`;
  }
  
  return DEFAULT_MESSAGES.ERROR;
}

/**
 * Creates scene step marker text
 * Visual indicator of progress in multi-step scenes
 * @param currentStep Current step number
 * @param totalSteps Total number of steps
 * @param title Scene title
 * @returns Formatted step marker text
 */
export function createStepMarker(currentStep: number, totalSteps: number, title: string): string {
  const steps = Array(totalSteps).fill('○');
  steps[currentStep - 1] = '●';
  return `*${title}* (Step ${currentStep}/${totalSteps})\n${steps.join(' ')}`;
}