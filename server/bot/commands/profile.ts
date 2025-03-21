import { Markup, Telegraf } from 'telegraf';
import { CopperxContext } from '../models';
import { requireAuth } from '../middleware/auth';
import { getUserProfile } from '../api/auth';
import { getKycStatus } from '../api/kyc';
import { formatKycStatus } from '../utils/format';

/**
 * Register profile command handlers
 * @param bot Telegraf bot instance
 */
export function registerProfileCommand(bot: Telegraf) {
  // Profile command
  bot.command('profile', requireAuth, async (ctx) => {
    await handleProfileCommand(ctx as any);
  });
  
  // Profile action handler
  bot.action('profile', requireAuth, async (ctx) => {
    await ctx.answerCbQuery();
    await handleProfileCommand(ctx as any);
  });
  
  // Actions for profile management
  bot.action('update_profile', requireAuth, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '🔄 To update your profile information, please visit the Copperx website: https://copperx.io/profile',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back to Profile', 'profile')],
      ])
    );
  });
}

/**
 * Handle profile command
 * @param ctx Telegram context
 */
async function handleProfileCommand(ctx: CopperxContext) {
  try {
    // Use cached user data if available, otherwise fetch from API
    let userData = ctx.session.auth?.user;
    let kycStatus = 'Unknown';
    
    if (ctx.session.auth?.accessToken) {
      try {
        // Get fresh user data
        userData = await getUserProfile(ctx.session.auth.accessToken);
        
        // Update session with latest user data
        if (ctx.session.auth) {
          ctx.session.auth.user = userData;
          await ctx.saveSession();
        }
        
        // Get KYC status
        if (userData.email) {
          const kycData = await getKycStatus(ctx.session.auth.accessToken, userData.email);
          kycStatus = formatKycStatus(kycData.status);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
    
    // Prepare profile display message
    const firstName = userData?.firstName || 'N/A';
    const lastName = userData?.lastName || '';
    const email = userData?.email || 'N/A';
    const accountType = userData?.type || 'Individual';
    const walletAddress = userData?.walletAddress 
      ? `${userData.walletAddress.substring(0, 6)}...${userData.walletAddress.substring(userData.walletAddress.length - 4)}`
      : 'Not set';
    
    const message = `👤 *Your Profile*

*Name:* ${firstName} ${lastName}
*Email:* ${email}
*Account Type:* ${accountType}
*KYC Status:* ${kycStatus}
*Wallet Address:* \`${walletAddress}\`
`;

    // Get the appropriate response method
    const respondMethod = 'callback_query' in ctx.update 
      ? ctx.editMessageText.bind(ctx) 
      : ctx.reply.bind(ctx);
    
    // Send profile information
    await respondMethod(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('💳 KYC Verification', 'kyc'),
          Markup.button.callback('✏️ Update Profile', 'update_profile')
        ],
        [Markup.button.callback('🏠 Main Menu', 'main_menu')]
      ])
    });
  } catch (error) {
    console.error('Profile command error:', error);
    await ctx.reply(
      '❌ Sorry, there was an error fetching your profile. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Main Menu', 'main_menu')]
      ])
    );
  }
}