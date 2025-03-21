import { Telegraf, Markup } from 'telegraf';
import { getUserProfile } from '../api/auth';

export function registerProfileCommand(bot: Telegraf) {
  // Handle /profile command
  bot.command('profile', async (ctx) => {
    await handleProfileCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('👤 Profile', async (ctx) => {
    await handleProfileCommand(ctx);
  });
  
  // Handle refresh profile action
  bot.action('refresh_profile', async (ctx) => {
    await ctx.answerCbQuery('Refreshing profile...');
    await handleProfileCommand(ctx);
  });
  
  // Handle logout action
  bot.action('logout', async (ctx) => {
    await ctx.answerCbQuery();
    
    // Confirm logout
    await ctx.reply(
      '❓ *Confirm Logout*\n\nAre you sure you want to log out? You will need to authenticate again to use the bot.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Yes, Log Out', 'confirm_logout')],
          [Markup.button.callback('No, Cancel', 'cancel_logout')]
        ])
      }
    );
  });
  
  // Handle logout confirmation
  bot.action('confirm_logout', async (ctx) => {
    await ctx.answerCbQuery();
    
    // Clear session
    delete ctx.session.auth;
    
    await ctx.reply(
      '👋 *Logged Out Successfully*\n\nYou have been logged out. Use /login to authenticate again.',
      {
        parse_mode: 'Markdown',
        ...Markup.removeKeyboard()
      }
    );
  });
  
  // Handle logout cancellation
  bot.action('cancel_logout', async (ctx) => {
    await ctx.answerCbQuery('Logout cancelled');
    await handleProfileCommand(ctx);
  });
}

async function handleProfileCommand(ctx: any) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Loading your profile...');
    
    // Get fresh user profile from API
    const userProfile = await getUserProfile(ctx.session.auth.accessToken);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    if (!userProfile) {
      await ctx.reply(
        '❌ Failed to load your profile. Please try again later.',
        Markup.inlineKeyboard([
          Markup.button.callback('Try Again', 'refresh_profile')
        ])
      );
      return;
    }
    
    // Update session with fresh user data
    ctx.session.auth.user = userProfile;
    
    // Create profile message
    let message = `👤 *User Profile*\n\n`;
    
    if (userProfile.firstName || userProfile.lastName) {
      message += `*Name:* ${userProfile.firstName || ''} ${userProfile.lastName || ''}\n`;
    }
    
    message += `*Email:* ${userProfile.email}\n`;
    message += `*Account Type:* ${userProfile.type.charAt(0).toUpperCase() + userProfile.type.slice(1)}\n`;
    message += `*Role:* ${userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}\n`;
    
    if (userProfile.organizationId) {
      message += `*Organization ID:* \`${userProfile.organizationId}\`\n`;
    }
    
    if (userProfile.walletAddress) {
      message += `*Wallet Address:* \`${userProfile.walletAddress}\`\n`;
    }
    
    // Send profile with actions
    await ctx.reply(
      message,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh Profile', 'refresh_profile')],
          [Markup.button.callback('🔑 Check KYC Status', 'refresh_kyc')],
          [Markup.button.callback('📤 Logout', 'logout')]
        ])
      }
    );
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    await ctx.reply(
      '❌ Failed to load your profile. Please try again later.',
      Markup.inlineKeyboard([
        Markup.button.callback('Try Again', 'refresh_profile')
      ])
    );
  }
}
