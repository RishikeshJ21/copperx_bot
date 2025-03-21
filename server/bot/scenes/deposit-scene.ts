import { Scenes } from 'telegraf';
import { CopperxContext } from '../models';
import { 
  createBackButton, 
  createWalletNetworkButtons,
  createDepositAddressButtons 
} from '../utils/markup';
import { getWalletBalances } from '../api/wallet';
import { getDepositAddress } from '../api/wallet';
import { requireAuth } from '../middleware/auth';
import { formatWalletAddress } from '../utils/format';

// Define scene state interface
interface DepositWizardState extends Scenes.WizardSessionData {
  wallets?: any[];
  selectedNetwork?: string;
  depositAddress?: string;
  qrCode?: string;
}

/**
 * Register deposit scene with Telegraf
 * @returns Array of scenes to be registered with the bot
 */
export function registerDepositScene(): Scenes.WizardScene<CopperxContext>[] {
  const depositScene = new Scenes.WizardScene<CopperxContext>(
    'deposit_scene',
    // Step 1: Get wallets and display network selection
    async (ctx) => {
      // Apply auth middleware
      await requireAuth(ctx, async () => {
        // Initialize or reset wizard state
        ctx.wizard.state = {};
        const wizardState = ctx.wizard.state as DepositWizardState;
        
        await ctx.reply(
          '⬆️ *Deposit Funds*\nFetching your wallets...',
          { parse_mode: 'Markdown' }
        );
        
        try {
          const accessToken = ctx.session.auth?.accessToken;
          if (!accessToken) {
            throw new Error('No access token found');
          }
          
          // Get wallet balances
          const walletResponse = await getWalletBalances(accessToken);
          wizardState.wallets = walletResponse.items;
          
          if (wizardState.wallets && wizardState.wallets.length > 0) {
            await ctx.reply(
              '🌐 *Select Network*\n\nChoose the network you want to deposit to:',
              {
                parse_mode: 'Markdown',
                ...createWalletNetworkButtons(wizardState.wallets, 'deposit_network')
              }
            );
          } else {
            await ctx.reply(
              '❌ You don\'t have any wallets available for deposits. Please contact support.',
              { ...createBackButton('main_menu') }
            );
            return await cancelScene(ctx);
          }
          
          return ctx.wizard.next();
        } catch (error) {
          console.error('Error fetching wallets:', error);
          await ctx.reply(
            '❌ Error fetching your wallet information. Please try again later.',
            { ...createBackButton('main_menu') }
          );
          return await cancelScene(ctx);
        }
      });
    },
    
    // Step 2: Process network selection and show deposit address
    async (ctx) => {
      const wizardState = ctx.wizard.state as DepositWizardState;
      
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'main_menu') {
          await ctx.answerCbQuery('Deposit operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data.startsWith('deposit_network_')) {
          const networkId = data.split('deposit_network_')[1];
          const selectedWallet = wizardState.wallets?.find(w => w.walletId === networkId || w.network === networkId);
          
          if (selectedWallet) {
            wizardState.selectedNetwork = selectedWallet.network;
            await ctx.answerCbQuery(`Selected ${selectedWallet.network} network`);
            
            try {
              // Get deposit address
              const accessToken = ctx.session.auth?.accessToken;
              if (!accessToken) {
                throw new Error('No access token found');
              }
              
              await ctx.reply(
                `🔄 Fetching your ${wizardState.selectedNetwork} deposit address...`,
                { parse_mode: 'Markdown' }
              );
              
              const depositAddressResponse = await getDepositAddress(accessToken, wizardState.selectedNetwork);
              
              if (depositAddressResponse && depositAddressResponse.address) {
                wizardState.depositAddress = depositAddressResponse.address;
                wizardState.qrCode = depositAddressResponse.qrCode;
                
                // Display deposit address
                let message = `💰 *Deposit Address*\n\n` +
                  `Network: ${wizardState.selectedNetwork.toUpperCase()}\n` +
                  `Address: \`${wizardState.depositAddress}\`\n\n` +
                  `📝 *Instructions*\n` +
                  `• Send only ${wizardState.selectedNetwork.toUpperCase()} tokens to this address\n` +
                  `• Always double-check the address before sending\n` +
                  `• Deposits typically take 10-30 minutes to appear`;
                
                if (depositAddressResponse.minAmount) {
                  message += `\n• Minimum deposit amount: ${depositAddressResponse.minAmount}`;
                }
                
                // If QR code is available, send it first
                if (wizardState.qrCode) {
                  try {
                    await ctx.replyWithPhoto(
                      { url: wizardState.qrCode },
                      { caption: 'Scan this QR code to deposit' }
                    );
                  } catch (qrError) {
                    console.error('Error sending QR code:', qrError);
                    // Continue without QR code
                  }
                }
                
                await ctx.reply(
                  message,
                  {
                    parse_mode: 'Markdown',
                    ...createDepositAddressButtons(wizardState.selectedNetwork, wizardState.depositAddress)
                  }
                );
                
                return ctx.wizard.next();
              } else {
                throw new Error('Could not retrieve deposit address');
              }
            } catch (error) {
              console.error('Error getting deposit address:', error);
              await ctx.reply(
                '❌ Error retrieving deposit address. Please try again later.',
                { ...createBackButton('main_menu') }
              );
              return await cancelScene(ctx);
            }
          }
        }
      }
    },
    
    // Step 3: Handle address actions
    async (ctx) => {
      const wizardState = ctx.wizard.state as DepositWizardState;
      
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'deposit') {
          // Go back to network selection
          await ctx.answerCbQuery('Returning to network selection');
          
          if (wizardState.wallets && wizardState.wallets.length > 0) {
            await ctx.reply(
              '🌐 *Select Network*\n\nChoose the network you want to deposit to:',
              {
                parse_mode: 'Markdown',
                ...createWalletNetworkButtons(wizardState.wallets, 'deposit_network')
              }
            );
          } else {
            return await cancelScene(ctx);
          }
          
          return ctx.wizard.back();
        }
        
        if (data === 'main_menu') {
          await ctx.answerCbQuery('Returning to main menu');
          return await cancelScene(ctx);
        }
        
        if (data.startsWith('copy_')) {
          const address = data.split('copy_')[1];
          await ctx.answerCbQuery(`Address copied: ${formatWalletAddress(address)}`);
          return;
        }
        
        if (data.startsWith('deposit_')) {
          const network = data.split('deposit_')[1];
          await ctx.answerCbQuery(`Refreshing ${network} deposit address...`);
          
          try {
            // Refresh deposit address
            const accessToken = ctx.session.auth?.accessToken;
            if (!accessToken) {
              throw new Error('No access token found');
            }
            
            const depositAddressResponse = await getDepositAddress(accessToken, network);
            
            if (depositAddressResponse && depositAddressResponse.address) {
              wizardState.depositAddress = depositAddressResponse.address;
              wizardState.qrCode = depositAddressResponse.qrCode;
              
              // Display refreshed deposit address
              let message = `💰 *Deposit Address (Refreshed)*\n\n` +
                `Network: ${network.toUpperCase()}\n` +
                `Address: \`${wizardState.depositAddress}\`\n\n` +
                `📝 *Instructions*\n` +
                `• Send only ${network.toUpperCase()} tokens to this address\n` +
                `• Always double-check the address before sending\n` +
                `• Deposits typically take 10-30 minutes to appear`;
              
              if (depositAddressResponse.minAmount) {
                message += `\n• Minimum deposit amount: ${depositAddressResponse.minAmount}`;
              }
              
              // If QR code is available, send it first
              if (wizardState.qrCode) {
                try {
                  await ctx.replyWithPhoto(
                    { url: wizardState.qrCode },
                    { caption: 'Scan this QR code to deposit' }
                  );
                } catch (qrError) {
                  console.error('Error sending QR code:', qrError);
                  // Continue without QR code
                }
              }
              
              await ctx.reply(
                message,
                {
                  parse_mode: 'Markdown',
                  ...createDepositAddressButtons(network, wizardState.depositAddress)
                }
              );
            } else {
              throw new Error('Could not refresh deposit address');
            }
          } catch (error) {
            console.error('Error refreshing deposit address:', error);
            await ctx.reply(
              '❌ Error refreshing deposit address. Please try again later.',
              { ...createBackButton('main_menu') }
            );
          }
        }
      }
    }
  );

  // Add listeners for the scene
  addSceneListeners(depositScene);

  return [depositScene];
}

/**
 * Add scene-specific listeners
 * @param scene Wizard scene instance
 */
function addSceneListeners(scene: Scenes.WizardScene<CopperxContext>) {
  // Global leave scene action
  scene.action('cancel_deposit', async (ctx) => {
    await ctx.answerCbQuery('Deposit operation cancelled');
    return await cancelScene(ctx);
  });

  // Handle back to main menu
  scene.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery('Returning to main menu');
    return await cancelScene(ctx);
  });
}

/**
 * Cancel scene and return to main menu
 * @param ctx Telegram context
 */
async function cancelScene(ctx: CopperxContext) {
  await ctx.reply(
    '🏠 Returning to main menu',
    createBackButton('main_menu')
  );
  return await ctx.scene.leave();
}