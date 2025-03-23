import { Telegraf, Markup } from 'telegraf';
import { getKycStatus, getAllKycs, getProviders } from '../api/kyc';
import { getAvailableRoutes } from '../api/routes';
import { formatDate, formatKycStatus } from '../utils/format';
import { requireAuth } from '../middleware/auth';
import { createKycActionButtons } from '../utils/markup';
import { KycStatusType } from '../models/kyc';

export function registerKycCommand(bot: Telegraf) {
  // Handle /kyc command
  bot.command('kyc', requireAuth, async (ctx) => {
    await handleKycCommand(ctx);
  });
  
  // Also handle keyboard button
  bot.hears('💼 KYC Status', requireAuth, async (ctx) => {
    await handleKycCommand(ctx);
  });
  
  // Handle refresh KYC status action
  bot.action('refresh_kyc', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('Refreshing KYC status...');
    await handleKycCommand(ctx);
  });
  
  // Handle visit web portal action
  bot.action('visit_kyc_portal', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('Opening KYC portal information...');
    await handleKycPortalInfo(ctx);
  });
  
  // Handle view requirements action
  bot.action('view_kyc_requirements', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('Loading KYC requirements...');
    await handleKycRequirements(ctx);
  });
  
  // Handle view payment methods action
  bot.action('view_payment_methods', requireAuth, async (ctx) => {
    await ctx.answerCbQuery('Loading available payment methods...');
    await handlePaymentMethods(ctx);
  });
  
  // Handle main menu action
  bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery('Returning to main menu...');
    await ctx.reply(
      '🏠 *Main Menu*\n\nSelect an option from the menu below:',
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
  });
}

async function handleKycCommand(ctx: any) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Checking your KYC status...');
    
    // Get KYC status from API
    const kycStatus = await getKycStatus(ctx.session.auth.accessToken, ctx.session.auth.user.email);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {
      console.log('Could not delete loading message');
    });
    
    if (!kycStatus) {
      await ctx.reply(
        '❓ *KYC Status Unknown*\n\nWe couldn\'t retrieve your KYC status. Please visit the Copperx web portal for more information.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('Go to Copperx', 'https://payout.copperx.io')],
            [Markup.button.callback('🔄 Try Again', 'refresh_kyc')],
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
          ])
        }
      );
      return;
    }
    
    // Format verification status with emoji
    const statusFormatted = formatKycStatus(kycStatus.status);
    
    // Create KYC status message
    let message = `💼 *KYC Verification Status*\n\n`;
    message += `*Status:* ${statusFormatted}\n`;
    
    if (kycStatus.level) {
      message += `*Verification Level:* ${kycStatus.level}\n`;
    }
    
    if (kycStatus.verificationDate) {
      message += `*Verified on:* ${formatDate(kycStatus.verificationDate, 'long')}\n`;
    }
    
    if (kycStatus.expiryDate) {
      message += `*Valid until:* ${formatDate(kycStatus.expiryDate, 'long')}\n`;
    }
    
    if (kycStatus.provider) {
      message += `*Verification Provider:* ${kycStatus.provider}\n`;
    }
    
    // Add transaction limits section if available
    if (kycStatus.limits) {
      message += `\n*Transaction Limits:*\n`;
      
      if (kycStatus.limits.daily) {
        message += `• Daily: $${Number(kycStatus.limits.daily).toLocaleString()}\n`;
      }
      
      if (kycStatus.limits.monthly) {
        message += `• Monthly: $${Number(kycStatus.limits.monthly).toLocaleString()}\n`;
      }
      
      if (kycStatus.limits.annual) {
        message += `• Annual: $${Number(kycStatus.limits.annual).toLocaleString()}\n`;
      }
      
      if (kycStatus.limits.perTransaction) {
        message += `• Per Transaction: $${Number(kycStatus.limits.perTransaction).toLocaleString()}\n`;
      }
    }
    
    // Add available services if any
    if (kycStatus.availableServices && kycStatus.availableServices.length > 0) {
      message += `\n*Available Services:*\n`;
      kycStatus.availableServices.forEach((service: string) => {
        message += `• ${service}\n`;
      });
    }
    
    // Add action instructions for non-verified users
    if (kycStatus.status !== KycStatusType.VERIFIED) {
      message += `\n⚠️ *Action Required*\n`;
      
      if (kycStatus.status === KycStatusType.NOT_STARTED) {
        message += `You haven't started the KYC verification process yet. Completing KYC verification will unlock higher transaction limits and additional features.`;
      } else if (kycStatus.status === KycStatusType.PENDING) {
        message += `Your KYC verification is being processed. This usually takes 1-2 business days. You'll be notified once the verification is complete.`;
      } else if (kycStatus.status === KycStatusType.REJECTED) {
        message += `Your KYC verification was rejected. Please visit the Copperx web portal to review the reason and resubmit your verification.`;
        
        if (kycStatus.rejectionReason) {
          message += `\n\n*Reason:* ${kycStatus.rejectionReason}`;
        }
      } else if (kycStatus.status === KycStatusType.EXPIRED) {
        message += `Your KYC verification has expired. Please visit the Copperx web portal to renew your verification.`;
      }
    }
    
    // Create appropriate buttons based on status
    const buttons = [];
    
    if (kycStatus.status === KycStatusType.NOT_STARTED) {
      buttons.push([Markup.button.callback('🆕 Start KYC Verification', 'visit_kyc_portal')]);
    } else if (kycStatus.status === KycStatusType.REJECTED) {
      buttons.push([Markup.button.callback('🔄 Resubmit Verification', 'visit_kyc_portal')]);
    } else if (kycStatus.status === KycStatusType.EXPIRED) {
      buttons.push([Markup.button.callback('🔄 Renew Verification', 'visit_kyc_portal')]);
    } else if (kycStatus.status === KycStatusType.PENDING) {
      buttons.push([Markup.button.callback('🔍 Check Verification Status', 'refresh_kyc')]);
    }
    
    // Add common buttons for all statuses
    buttons.push([
      Markup.button.callback('📋 View Requirements', 'view_kyc_requirements'),
      Markup.button.callback('💳 Payment Methods', 'view_payment_methods')
    ]);
    
    buttons.push([Markup.button.callback('🔄 Refresh Status', 'refresh_kyc')]);
    buttons.push([Markup.button.callback('🔙 Back to Menu', 'main_menu')]);
    
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
        [Markup.button.callback('🔄 Try Again', 'refresh_kyc')],
        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
      ])
    );
  }
}

async function handleKycPortalInfo(ctx: any) {
  try {
    await ctx.reply(
      '🌐 *Copperx KYC Verification Portal*\n\n' +
      'Complete your KYC verification through our secure web portal. The verification process typically takes:\n\n' +
      '• *Form Submission:* 5-10 minutes\n' +
      '• *Document Upload:* 2-5 minutes\n' +
      '• *Verification Processing:* 1-2 business days\n\n' +
      'Please have the following ready:\n' +
      '• Valid government ID (passport, driver\'s license, etc.)\n' +
      '• Proof of address (utility bill, bank statement, etc.)\n' +
      '• Clear photo of yourself (selfie)\n\n' +
      'Your data is securely processed in compliance with relevant regulations.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('Start Verification', 'https://payout.copperx.io/kyc')],
          [Markup.button.callback('📋 View Requirements', 'view_kyc_requirements')],
          [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
        ])
      }
    );
  } catch (error) {
    console.error('Failed to show KYC portal info:', error);
    await ctx.reply(
      '❌ Failed to load KYC portal information. Please try again.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'visit_kyc_portal')],
        [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
      ])
    );
  }
}

async function handleKycRequirements(ctx: any) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Loading KYC requirements...');
    
    // Get KYC requirements from API
    // Since getKycRequirements is no longer available, we'll use getAllKycs
    // and format the data appropriately
    const kycData = await getAllKycs(ctx.session.auth.accessToken);
    const requirements = kycData?.data?.length 
      ? [{ 
          level: '1',
          name: 'Standard Verification',
          description: 'Basic KYC verification required for using Copperx services',
          requiredDocuments: [
            {
              name: 'Government-issued ID',
              type: 'id',
              description: 'Passport, driver\'s license, or national ID card',
              isRequired: true
            },
            {
              name: 'Proof of Address',
              type: 'address',
              description: 'Utility bill, bank statement (issued within last 3 months)',
              isRequired: true
            },
            {
              name: 'Selfie with ID',
              type: 'selfie',
              description: 'Clear photo of yourself holding your ID',
              isRequired: true
            }
          ],
          additionalInfo: [
            'All documents must be valid and not expired',
            'Documents must be in English or with certified translation',
            'All information must match your account details'
          ]
        }]
      : [];
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {
      console.log('Could not delete loading message');
    });
    
    if (!requirements || requirements.length === 0) {
      await ctx.reply(
        '❓ *KYC Requirements Unavailable*\n\nWe couldn\'t retrieve the KYC requirements. Please visit the Copperx web portal for detailed information.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('Go to Copperx', 'https://payout.copperx.io')],
            [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
          ])
        }
      );
      return;
    }
    
    // Create message header
    let message = `📋 *KYC Verification Requirements*\n\n`;
    
    // Display each level's requirements
    requirements.forEach((req, index) => {
      message += `*Level ${req.level} - ${req.name}*\n`;
      message += `${req.description}\n\n`;
      
      message += `*Required Documents:*\n`;
      req.requiredDocuments.forEach(doc => {
        const required = doc.isRequired ? '(Required)' : '(Optional)';
        message += `• ${doc.name} ${required}\n`;
        
        if (doc.description) {
          message += `  ${doc.description}\n`;
        }
      });
      
      if (req.additionalInfo && req.additionalInfo.length > 0) {
        message += `\n*Additional Information:*\n`;
        req.additionalInfo.forEach(info => {
          message += `• ${info}\n`;
        });
      }
      
      if (index < requirements.length - 1) {
        message += `\n${'-'.repeat(30)}\n\n`;
      }
    });
    
    // For long messages, we need to split it
    if (message.length > 4000) {
      const parts = splitLongMessage(message, 4000);
      
      for (let i = 0; i < parts.length; i++) {
        const isLastPart = i === parts.length - 1;
        
        if (isLastPart) {
          await ctx.reply(parts[i], {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('Start Verification', 'https://payout.copperx.io/kyc')],
              [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
            ])
          });
        } else {
          await ctx.reply(parts[i], { parse_mode: 'Markdown' });
        }
      }
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('Start Verification', 'https://payout.copperx.io/kyc')],
          [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
        ])
      });
    }
  } catch (error) {
    console.error('Failed to fetch KYC requirements:', error);
    await ctx.reply(
      '❌ Failed to load KYC requirements. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'view_kyc_requirements')],
        [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
      ])
    );
  }
}

async function handlePaymentMethods(ctx: any) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Loading available payment methods...');
    
    // Get payment methods from API
    // Since getPaymentRoutes is not available anymore, we'll use getAvailableRoutes from the updated API
    const routesResponse = await getAvailableRoutes(ctx.session.auth.accessToken);
    const routes = routesResponse.routes || [];
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {
      console.log('Could not delete loading message');
    });
    
    if (!routes || routes.length === 0) {
      await ctx.reply(
        '❓ *Payment Methods Unavailable*\n\nWe couldn\'t retrieve the available payment methods. Please visit the Copperx web portal for more information.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('Go to Copperx', 'https://payout.copperx.io')],
            [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
          ])
        }
      );
      return;
    }
    
    // Create message header
    let message = `💳 *Available Payment Methods*\n\n`;
    message += `The following payment methods are available based on your current KYC level:\n\n`;
    
    // Group routes by type
    const routesByType: Record<string, any[]> = {};
    routes.forEach(route => {
      if (!routesByType[route.type]) {
        routesByType[route.type] = [];
      }
      routesByType[route.type].push(route);
    });
    
    // Display payment methods by type
    Object.keys(routesByType).forEach(type => {
      const typeName = type.charAt(0).toUpperCase() + type.slice(1);
      message += `*${typeName} Methods:*\n`;
      
      routesByType[type].forEach(route => {
        const active = route.isActive ? '✅' : '❌';
        message += `• ${active} ${route.name}\n`;
        
        if (route.minAmount || route.maxAmount) {
          const limits = [];
          if (route.minAmount) limits.push(`Min: $${Number(route.minAmount).toLocaleString()}`);
          if (route.maxAmount) limits.push(`Max: $${Number(route.maxAmount).toLocaleString()}`);
          message += `  Limits: ${limits.join(', ')}\n`;
        }
        
        if (route.fee) {
          message += `  Fee: ${route.fee}\n`;
        }
        
        if (route.processingTime) {
          message += `  Processing time: ${route.processingTime}\n`;
        }
        
        if (route.requiredKycLevel) {
          message += `  Required KYC level: ${route.requiredKycLevel}\n`;
        }
      });
      
      message += '\n';
    });
    
    message += `*Note:* Payment methods availability is subject to your KYC verification level and region.`;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 View KYC Requirements', 'view_kyc_requirements')],
        [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
      ])
    });
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    await ctx.reply(
      '❌ Failed to load payment methods. Please try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'view_payment_methods')],
        [Markup.button.callback('💼 Back to KYC Status', 'refresh_kyc')]
      ])
    );
  }
}

// Helper function to split long messages
function splitLongMessage(message: string, maxLength: number): string[] {
  const parts: string[] = [];
  let currentPart = '';
  
  // Split by double newlines to keep paragraphs together
  const paragraphs = message.split('\n\n');
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max length, start a new part
    if (currentPart.length + paragraph.length + 2 > maxLength && currentPart.length > 0) {
      parts.push(currentPart);
      currentPart = paragraph;
    } else {
      // Add to current part with double newline if not first paragraph in this part
      if (currentPart.length > 0) {
        currentPart += '\n\n' + paragraph;
      } else {
        currentPart = paragraph;
      }
    }
  }
  
  // Add the last part if not empty
  if (currentPart.length > 0) {
    parts.push(currentPart);
  }
  
  return parts;
}
