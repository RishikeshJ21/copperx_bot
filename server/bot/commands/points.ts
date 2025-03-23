import { Markup, Telegraf } from 'telegraf';
import { CopperxContext } from '../models';
import { requireAuth } from '../middleware/auth';
import { formatCurrency } from '../utils/format';
import { createMainMenuButtons } from '../utils/markup';
import {
  getAllPoints,
  getTotalPoints,
  getOrganizationInfo,
  applyReferralCode
} from '../api/points';

/**
 * Register points command handlers
 * @param bot Telegraf bot instance
 */
export function registerPointsCommand(bot: Telegraf<CopperxContext>) {
  // Main points command
  bot.command('points', requireAuth, handlePointsCommand);
  
  // Action handlers
  bot.action('show_referral_code', requireAuth, showReferralCode);
  bot.action('show_points_breakdown', requireAuth, showPointsBreakdown);
  bot.action('apply_referral_code', requireAuth, startApplyReferralCode);
  
  // Handle referral code input
  bot.on('message', async (ctx, next) => {
    // Only process if we're waiting for a referral code
    if (ctx.session.referralCodeInput && ctx.message && 'text' in ctx.message) {
      await handleReferralCodeInput(ctx);
    } else {
      // Pass to next middleware if not handling referral code
      return next();
    }
  });
  
  // Copy code action handler
  bot.action(/copy_code_(.+)/, requireAuth, copyReferralCode);
  
  // Points menu action
  bot.action('points_menu', requireAuth, handlePointsCommand);
}

/**
 * Handle the points command
 * @param ctx Telegram context
 */
async function handlePointsCommand(ctx: CopperxContext) {
  try {
    if (!ctx.session.auth?.accessToken) {
      return ctx.reply('You need to log in first. Use /login to authenticate.');
    }
    
    const accessToken = ctx.session.auth.accessToken;
    const email = ctx.session.auth.user?.email || '';
    
    // Get total points
    const pointsData = await getTotalPoints(accessToken, email);
    
    // Build message
    let message = `🏆 *Your Copperx Points*\n\n`;
    message += `Total Points: *${pointsData.total}*\n\n`;
    message += `Points can be earned by:\n`;
    message += `• Making transactions on the platform\n`;
    message += `• Referring new users with your referral code\n`;
    message += `• Completing special promotions\n\n`;
    message += `What would you like to do?`;
    
    // Create buttons for points actions
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📊 View Points Breakdown', 'show_points_breakdown')],
      [Markup.button.callback('🔗 My Referral Code', 'show_referral_code')],
      [Markup.button.callback('📱 Apply Referral Code', 'apply_referral_code')],
      [Markup.button.callback('⬅️ Back to Main Menu', 'main_menu')]
    ]);
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...buttons
    });
  } catch (error: any) {
    console.error('Error in points command:', error);
    await ctx.reply(`❌ Error retrieving your points: ${error.message}\n\nPlease try again later.`);
  }
}

/**
 * Show the user's referral code
 * @param ctx Telegram context
 */
async function showReferralCode(ctx: CopperxContext) {
  try {
    if (!ctx.session.auth?.accessToken) {
      return ctx.reply('You need to log in first. Use /login to authenticate.');
    }
    
    const accessToken = ctx.session.auth.accessToken;
    
    // Get organization info which contains the referral code
    const orgInfo = await getOrganizationInfo(accessToken);
    
    if (!orgInfo.referralCode) {
      return ctx.reply('❌ You don\'t have a referral code yet. Please contact support.');
    }
    
    // Build share URL 
    const shareUrl = `https://app.copperx.io/signup?referral=${orgInfo.referralCode}`;
    
    // Build message
    let message = `🔗 *Your Referral Code*\n\n`;
    message += `\`${orgInfo.referralCode}\`\n\n`;
    message += `Share this code with friends to earn bonus points!\n\n`;
    message += `*How it works:*\n`;
    message += `1. Share your referral code or link\n`;
    message += `2. When someone signs up with your code, you both earn points\n`;
    message += `3. Earn additional points when your referrals complete transactions\n\n`;
    message += `*Referral Link:*\n${shareUrl}`;
    
    // Create a more descriptive share message
    const shareMessage = 'Join Copperx - the stablecoin bank for international payments! Use my referral code and we both get bonus points!';
    
    // Create buttons for sharing and copying
    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Copy Code', `copy_code_${orgInfo.referralCode}`),
        Markup.button.url('🔄 Share Link', `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`)
      ],
      [Markup.button.callback('⬅️ Back to Points', 'points_menu')]
    ]);
    
    // Send message with the buttons
    await ctx.reply(message, {
      parse_mode: 'Markdown', 
      reply_markup: buttons.reply_markup
    });
    
    // Then send the "how to share" message
    await ctx.reply('💡 *Tip*: Tap on the code above to copy it or use the "Share Link" button to easily share your referral link with friends.', {
      parse_mode: 'Markdown'
    });
  } catch (error: any) {
    console.error('Error showing referral code:', error);
    await ctx.reply(`❌ Error retrieving your referral code: ${error.message}\n\nPlease try again later.`);
  }
}

/**
 * Copy referral code to clipboard
 * Note: Actual clipboard copy isn't possible through Telegram bot API,
 * but we can make it easy for users to copy manually
 * @param ctx Telegram context
 */
async function copyReferralCode(ctx: CopperxContext) {
  try {
    const callbackData = ctx.callbackQuery?.data || '';
    const referralCode = callbackData.replace('copy_code_', '');
    
    await ctx.answerCbQuery('Code ready to copy!');
    
    await ctx.reply(`*Your Referral Code:*\n\n\`${referralCode}\`\n\n✅ This code is formatted for easy copying.\n\n📋 *How to copy:* Simply tap on the code above, and it will be copied to your clipboard.`, {
      parse_mode: 'Markdown'
    });
  } catch (error: any) {
    console.error('Error copying referral code:', error);
    await ctx.reply(`❌ Error copying your referral code: ${error.message}\n\nPlease try again later.`);
  }
}

/**
 * Show detailed breakdown of points
 * @param ctx Telegram context
 */
async function showPointsBreakdown(ctx: CopperxContext) {
  try {
    if (!ctx.session.auth?.accessToken) {
      return ctx.reply('You need to log in first. Use /login to authenticate.');
    }
    
    const accessToken = ctx.session.auth.accessToken;
    
    // Get all points data
    const pointsData = await getAllPoints(accessToken);
    
    // Build message
    let message = `📊 *Points Breakdown*\n\n`;
    
    // Offramp Transfer Points
    message += `*Transaction Points:*\n`;
    if (pointsData.offrampTransferPoints.data.length > 0) {
      pointsData.offrampTransferPoints.data.forEach((item, index) => {
        message += `${index + 1}. Amount: $${formatCurrency(parseFloat(item.amountUSD))}\n`;
        message += `   Transactions: ${item.noOfTransactions}\n`;
        message += `   Multiplier: ${item.multiplier}x\n`;
        message += `   Points: ${item.points}\n\n`;
      });
    } else {
      message += `No transaction points yet.\n\n`;
    }
    
    // Referral Points
    message += `*Referral Points:*\n`;
    if (pointsData.payoutReferralPoints.data.length > 0) {
      pointsData.payoutReferralPoints.data.forEach((item, index) => {
        message += `${index + 1}. Reference: ${item.reference}\n`;
        message += `   Total Transactions: ${item.totalTransactions}\n`;
        message += `   Transaction Points: ${item.transactionPoints}\n`;
        message += `   Referral Points: ${item.referralPoints}\n`;
        message += `   Total Points: ${item.totalPoints}\n\n`;
      });
    } else {
      message += `No referral points yet. Share your referral code to earn points!\n\n`;
    }
    
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('🔗 My Referral Code', 'show_referral_code')],
      [Markup.button.callback('⬅️ Back to Points', 'points_menu')]
    ]);
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...buttons
    });
  } catch (error: any) {
    console.error('Error showing points breakdown:', error);
    await ctx.reply(`❌ Error retrieving your points breakdown: ${error.message}\n\nPlease try again later.`);
  }
}

/**
 * Start the apply referral code flow
 * @param ctx Telegram context
 */
async function startApplyReferralCode(ctx: CopperxContext) {
  try {
    // Set flag to indicate we're waiting for referral code input
    ctx.session.referralCodeInput = true;
    
    await ctx.reply(`Please enter the referral code you want to apply:`, {
      reply_markup: {
        keyboard: [
          [{ text: '❌ Cancel' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  } catch (error: any) {
    console.error('Error starting apply referral code flow:', error);
    await ctx.reply(`❌ Error: ${error.message}\n\nPlease try again later.`);
  }
}

/**
 * Handle referral code input
 * @param ctx Telegram context
 */
async function handleReferralCodeInput(ctx: CopperxContext) {
  try {
    if (!ctx.message || !('text' in ctx.message)) {
      return;
    }
    
    const input = ctx.message.text;
    
    // Reset the input flag
    ctx.session.referralCodeInput = false;
    
    // Check for cancel
    if (input === '❌ Cancel') {
      await ctx.reply('Operation cancelled.', {
        reply_markup: { remove_keyboard: true }
      });
      return await handlePointsCommand(ctx);
    }
    
    if (!ctx.session.auth?.accessToken) {
      return ctx.reply('You need to log in first. Use /login to authenticate.', {
        reply_markup: { remove_keyboard: true }
      });
    }
    
    const accessToken = ctx.session.auth.accessToken;
    
    // Apply the referral code
    const result = await applyReferralCode(accessToken, input);
    
    // Remove keyboard
    await ctx.reply(`✅ Referral code applied successfully! ${result.message}`, {
      reply_markup: { remove_keyboard: true }
    });
    
    // Navigate back to points menu
    setTimeout(() => handlePointsCommand(ctx), 1000);
  } catch (error: any) {
    console.error('Error applying referral code:', error);
    await ctx.reply(`❌ Error applying referral code: ${error.message}\n\nPlease try again later.`, {
      reply_markup: { remove_keyboard: true }
    });
    
    // Navigate back to points menu
    setTimeout(() => handlePointsCommand(ctx), 1000);
  }
}