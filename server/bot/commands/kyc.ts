import { Telegraf, Markup } from 'telegraf';
import { getKycStatus } from '../api/kyc';

export function registerKycCommand(bot: Telegraf) {
  // Handle /kyc command
  bot.command('kyc', async (ctx) => {
    await handleKycCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('💼 KYC Status', async (ctx) => {
    await handleKycCommand(ctx);
  });
  
  // Handle refresh KYC status action
  bot.action('refresh_kyc', async (ctx) => {
    await ctx.answerCbQuery('Refreshing KYC status...');
    await handleKycCommand(ctx);
  });
  
  // Handle visit web portal action
  bot.action('visit_kyc_portal', async (ctx) => {
    await ctx.answerCbQuery('Redirecting to web portal...');
    
    await ctx.reply(
      '🌐 *Visit Copperx KYC Portal*\n\nUse the link below to complete your KYC verification or view more details:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('Open KYC Portal', 'https://payout.copperx.io/kyc')],
          [Markup.button.callback('Back to KYC Status', 'refresh_kyc')]
        ])
      }
    );
  });
  
  // Handle close KYC status
  bot.action('close_kyc_status', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '🔙 Back to main menu',
      Markup.keyboard([
        ['💰 Balance', '👛 Wallets'],
        ['📤 Send', '📥 Deposit'],
        ['📋 History', '👤 Profile'],
        ['💼 KYC Status', '❓ Help']
      ]).resize()
    );
  });
}

async function handleKycCommand(ctx: any) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Checking your KYC status...');
    
    // Get KYC status from API
    const kycStatus = await getKycStatus(ctx.session.auth.accessToken, ctx.session.auth.user.email);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    if (!kycStatus) {
      await ctx.reply(
        '❓ *KYC Status Unknown*\n\nWe couldn\'t retrieve your KYC status. Please visit the Copperx web portal for more information.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('Go to Copperx', 'https://payout.copperx.io')],
            [Markup.button.callback('Try Again', 'refresh_kyc')]
          ])
        }
      );
      return;
    }
    
    // Format verification status
    let statusEmoji, statusText, statusColor;
    
    switch (kycStatus.status) {
      case 'verified':
        statusEmoji = '✅';
        statusText = 'Verified';
        statusColor = 'green';
        break;
      case 'pending':
        statusEmoji = '⏳';
        statusText = 'Pending';
        statusColor = 'yellow';
        break;
      case 'rejected':
        statusEmoji = '❌';
        statusText = 'Rejected';
        statusColor = 'red';
        break;
      default:
        statusEmoji = '❓';
        statusText = 'Not Started';
        statusColor = 'gray';
    }
    
    // Create KYC status message
    let message = `💼 *KYC Verification Status*\n\n`;
    message += `*Status:* ${statusEmoji} ${statusText}\n`;
    
    if (kycStatus.level) {
      message += `*Verification Level:* ${kycStatus.level}\n`;
    }
    
    if (kycStatus.verificationDate) {
      message += `*Verification Date:* ${new Date(kycStatus.verificationDate).toLocaleDateString()}\n`;
    }
    
    if (kycStatus.limits) {
      message += `\n*Transaction Limits:*\n`;
      
      if (kycStatus.limits.daily) {
        message += `• Daily: $${kycStatus.limits.daily.toLocaleString()}\n`;
      }
      
      if (kycStatus.limits.monthly) {
        message += `• Monthly: $${kycStatus.limits.monthly.toLocaleString()}\n`;
      }
    }
    
    if (kycStatus.availableServices && kycStatus.availableServices.length > 0) {
      message += `\n*Available Services:*\n`;
      kycStatus.availableServices.forEach((service: string) => {
        message += `• ${service}\n`;
      });
    }
    
    if (kycStatus.status !== 'verified') {
      message += `\n⚠️ *Action Required*\n`;
      message += `Your KYC verification is ${statusText.toLowerCase()}. Please visit the Copperx web portal to ${kycStatus.status === 'rejected' ? 'resubmit your verification' : 'complete the verification process'}.`;
    }
    
    // Create appropriate buttons based on status
    const buttons = [];
    
    if (kycStatus.status !== 'verified') {
      buttons.push([Markup.button.callback('Complete KYC Verification', 'visit_kyc_portal')]);
    } else {
      buttons.push([Markup.button.callback('View KYC Details', 'visit_kyc_portal')]);
    }
    
    buttons.push([Markup.button.callback('Refresh Status', 'refresh_kyc')]);
    buttons.push([Markup.button.callback('Close', 'close_kyc_status')]);
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  } catch (error) {
    console.error('Failed to fetch KYC status:', error);
    await ctx.reply(
      '❌ Failed to check your KYC status. Please try again later or visit the Copperx web portal.',
      Markup.inlineKeyboard([
        [Markup.button.url('Go to Copperx', 'https://payout.copperx.io')],
        [Markup.button.callback('Try Again', 'refresh_kyc')]
      ])
    );
  }
}
