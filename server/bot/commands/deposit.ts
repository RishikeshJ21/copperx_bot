import { Telegraf, Markup } from 'telegraf';
import { getDepositAddress } from '../api/wallet';

export function registerDepositCommand(bot: Telegraf) {
  // Handle /deposit command
  bot.command('deposit', async (ctx) => {
    await handleDepositCommand(ctx);
  });
  
  // Also handle the keyboard button
  bot.hears('📥 Deposit', async (ctx) => {
    await handleDepositCommand(ctx);
  });
  
  // Handle action from balance page
  bot.action('show_deposit', async (ctx) => {
    await ctx.answerCbQuery();
    await handleDepositCommand(ctx);
  });
  
  // Handle network selection for deposit
  bot.action(/^deposit_network:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const network = ctx.match[1];
    await showDepositInstructions(ctx, network);
  });
  
  // Handle wallet-specific deposit action
  bot.action(/^deposit_to:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const network = ctx.match[1];
    await showDepositInstructions(ctx, network);
  });
  
  // Handle copy address action
  bot.action(/^copy_address:(.+):(.+)$/, async (ctx) => {
    const network = ctx.match[1];
    const address = ctx.match[2];
    
    await ctx.answerCbQuery(`Address copied: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
    
    // The bot can't actually copy to clipboard, but we can show the address again for easy copying
    await ctx.reply(
      `📋 *Copy This Address*\n\n\`${address}\`\n\nNetwork: ${network.charAt(0).toUpperCase() + network.slice(1)}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Back to Deposit Options', 'show_deposit')]
        ])
      }
    );
  });
  
  // Generate QR code for address (this would need a QR code library in a real implementation)
  bot.action(/^generate_qr:(.+):(.+)$/, async (ctx) => {
    const network = ctx.match[1];
    const address = ctx.match[2];
    
    await ctx.answerCbQuery();
    
    await ctx.reply(
      `🔄 Creating QR code for address on ${network.charAt(0).toUpperCase() + network.slice(1)} network...`
    );
    
    // In a full implementation, you would generate and send a QR code image here
    // Since we can't generate images in this example, we'll just send the address
    await ctx.reply(
      `📋 *Deposit Address QR Code*\n\nNetwork: ${network.charAt(0).toUpperCase() + network.slice(1)}\nAddress: \`${address}\`\n\nPlease scan this QR code to deposit funds.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Back to Deposit Instructions', `deposit_network:${network}`)]
        ])
      }
    );
  });
  
  // Handle close deposit
  bot.action('close_deposit', async (ctx) => {
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

async function handleDepositCommand(ctx: any) {
  try {
    // Get available networks (could get this from wallets or a separate API call)
    const networks = ['polygon', 'solana', 'ethereum']; // Example networks
    
    // Create network selection buttons
    const buttons = networks.map(network => {
      const networkName = network.charAt(0).toUpperCase() + network.slice(1);
      return [Markup.button.callback(`${networkName}`, `deposit_network:${network}`)];
    });
    
    // Add close button
    buttons.push([Markup.button.callback('Close', 'close_deposit')]);
    
    await ctx.reply(
      '📥 *Deposit USDC*\n\nSelect the network you want to deposit to:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
  } catch (error) {
    console.error('Failed to show deposit options:', error);
    await ctx.reply(
      '❌ Failed to load deposit options. Please try again later.',
      Markup.inlineKeyboard([
        Markup.button.callback('Try Again', 'show_deposit')
      ])
    );
  }
}

async function showDepositInstructions(ctx: any, network: string) {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('Generating deposit address...');
    
    // Get deposit address from API
    const depositInfo = await getDepositAddress(ctx.session.auth.accessToken, network);
    
    // Delete loading message
    await ctx.deleteMessage(loadingMsg.message_id);
    
    if (!depositInfo || !depositInfo.address) {
      await ctx.reply(
        `❌ Failed to generate deposit address for ${network} network. Please try another network or try again later.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('Try Again', `deposit_network:${network}`)],
          [Markup.button.callback('Select Different Network', 'show_deposit')]
        ])
      );
      return;
    }
    
    // Format network name for display
    const networkName = network.charAt(0).toUpperCase() + network.slice(1);
    
    // Send deposit instructions
    await ctx.reply(
      `📥 *${networkName} Deposit Instructions*\n\n*Your Deposit Address:*\n\`${depositInfo.address}\`\n\n⚠️ *Important:*\n• Only send USDC on the ${networkName} network\n• Minimum deposit amount: 10 USDC\n• Deposits usually confirm within 5-10 minutes\n• You'll receive a notification when your deposit arrives`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📋 Copy Address', `copy_address:${network}:${depositInfo.address}`)],
          [Markup.button.callback('📱 Generate QR Code', `generate_qr:${network}:${depositInfo.address}`)],
          [Markup.button.callback('Select Different Network', 'show_deposit')],
          [Markup.button.callback('Close', 'close_deposit')]
        ])
      }
    );
  } catch (error) {
    console.error(`Failed to get deposit address for ${network}:`, error);
    
    await ctx.reply(
      `❌ Failed to generate deposit address for ${network} network. ${error.message || 'Please try again later.'}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('Try Again', `deposit_network:${network}`)],
        [Markup.button.callback('Select Different Network', 'show_deposit')]
      ])
    );
  }
}
