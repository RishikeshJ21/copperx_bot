import { Scenes } from 'telegraf';
import { CopperxContext } from '../models';
import { isValidEmail, isValidWalletAddress, isValidAmount } from '../utils/validation';
import { formatCurrency, truncateWithEllipsis } from '../utils/format';
import { 
  createBackButton, 
  createConfirmButtons, 
  createWalletNetworkButtons
} from '../utils/markup';
import { getTransferFee, sendFunds } from '../api/transfer';
import { getWalletBalances } from '../api/wallet';
import { requireAuth } from '../middleware/auth';

// Define scene state interface
interface SendWizardState extends Scenes.WizardSessionData {
  method?: 'email' | 'wallet';
  recipient?: string;
  amount?: string;
  network?: string;
  fee?: string;
  wallets?: any[];
  total?: string;
}

/**
 * Register send scene with Telegraf
 * @returns Array of scenes to be registered with the bot
 */
export function registerSendScene(): Scenes.WizardScene<CopperxContext>[] {
  const sendScene = new Scenes.WizardScene<CopperxContext>(
    'send_scene',
    // Step 1: Choose method (email or wallet)
    async (ctx) => {
      // Apply auth middleware
      await requireAuth(ctx, async () => {
        // Initialize or reset wizard state
        ctx.wizard.state = {};
        
        await ctx.reply(
          '💸 *Send Funds*\nChoose a method to send your funds:',
          {
            parse_mode: 'Markdown',
            ...Scenes.WizardScene.markup.inlineKeyboard([
              [
                Scenes.WizardScene.markup.button.callback('📧 Send to Email', 'method_email'),
                Scenes.WizardScene.markup.button.callback('🔑 Send to Wallet', 'method_wallet')
              ],
              [Scenes.WizardScene.markup.button.callback('❌ Cancel', 'cancel_send')]
            ])
          }
        );
        
        return ctx.wizard.next();
      });
    },
    
    // Step 2: Ask for recipient based on method
    async (ctx) => {
      // Handle method selection
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'cancel_send') {
          await ctx.answerCbQuery('Send operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data === 'method_email' || data === 'method_wallet') {
          const wizardState = ctx.wizard.state as SendWizardState;
          wizardState.method = data === 'method_email' ? 'email' : 'wallet';
          
          await ctx.answerCbQuery(`Selected ${wizardState.method} method`);
          
          if (wizardState.method === 'email') {
            await ctx.reply(
              '📧 *Send to Email*\n\nEnter the email address of the recipient:',
              {
                parse_mode: 'Markdown',
                ...createBackButton('cancel_send')
              }
            );
          } else {
            await ctx.reply(
              '🔑 *Send to Wallet*\n\nEnter the wallet address of the recipient:',
              {
                parse_mode: 'Markdown',
                ...createBackButton('cancel_send')
              }
            );
          }
          
          return ctx.wizard.next();
        }
      }
      
      // If we get here without a valid callback, ask again
      await ctx.reply(
        '❓ Please select a method to continue:',
        {
          ...Scenes.WizardScene.markup.inlineKeyboard([
            [
              Scenes.WizardScene.markup.button.callback('📧 Send to Email', 'method_email'),
              Scenes.WizardScene.markup.button.callback('🔑 Send to Wallet', 'method_wallet')
            ],
            [Scenes.WizardScene.markup.button.callback('❌ Cancel', 'cancel_send')]
          ])
        }
      );
    },
    
    // Step 3: Process recipient and ask for amount
    async (ctx) => {
      const wizardState = ctx.wizard.state as SendWizardState;
      
      // Handle text input for recipient
      if (ctx.message && 'text' in ctx.message) {
        const recipient = ctx.message.text;
        
        // Validate recipient based on method
        if (wizardState.method === 'email') {
          if (!isValidEmail(recipient)) {
            await ctx.reply(
              '❌ Invalid email address. Please enter a valid email:',
              { ...createBackButton('cancel_send') }
            );
            return;
          }
        } else if (wizardState.method === 'wallet') {
          if (!isValidWalletAddress(recipient)) {
            await ctx.reply(
              '❌ Invalid wallet address. Please enter a valid address:',
              { ...createBackButton('cancel_send') }
            );
            return;
          }
        }
        
        // Save recipient and get wallets for next step
        wizardState.recipient = recipient;
        
        try {
          const accessToken = ctx.session.auth?.accessToken;
          if (!accessToken) {
            throw new Error('No access token found');
          }
          
          // Get wallet balances
          const walletResponse = await getWalletBalances(accessToken);
          wizardState.wallets = walletResponse.items;
          
          // Ask for amount
          await ctx.reply(
            `💰 *Amount to Send*\n\nEnter the amount you want to send to ${truncateWithEllipsis(recipient)}:`,
            {
              parse_mode: 'Markdown',
              ...createBackButton('cancel_send')
            }
          );
          
          return ctx.wizard.next();
        } catch (error) {
          console.error('Error fetching wallets:', error);
          await ctx.reply(
            '❌ Error fetching your wallet information. Please try again later.',
            { ...createBackButton('cancel_send') }
          );
        }
      } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        if (ctx.callbackQuery.data === 'cancel_send') {
          await ctx.answerCbQuery('Send operation cancelled');
          return await cancelScene(ctx);
        }
      }
    },
    
    // Step 4: Process amount and select network
    async (ctx) => {
      const wizardState = ctx.wizard.state as SendWizardState;
      
      // Handle text input for amount
      if (ctx.message && 'text' in ctx.message) {
        const amount = ctx.message.text;
        
        // Validate amount
        if (!isValidAmount(amount)) {
          await ctx.reply(
            '❌ Invalid amount. Please enter a valid number:',
            { ...createBackButton('cancel_send') }
          );
          return;
        }
        
        // Save amount
        wizardState.amount = amount;
        
        // Show network selection
        if (wizardState.wallets && wizardState.wallets.length > 0) {
          await ctx.reply(
            '🌐 *Select Network*\n\nChoose the network you want to send from:',
            {
              parse_mode: 'Markdown',
              ...createWalletNetworkButtons(wizardState.wallets, 'network')
            }
          );
        } else {
          await ctx.reply(
            '❌ You don\'t have any wallets available for sending. Please add funds first.',
            { ...createBackButton('main_menu') }
          );
          return await cancelScene(ctx);
        }
        
        return ctx.wizard.next();
      } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        if (ctx.callbackQuery.data === 'cancel_send') {
          await ctx.answerCbQuery('Send operation cancelled');
          return await cancelScene(ctx);
        }
      }
    },
    
    // Step 5: Process network selection and show confirmation
    async (ctx) => {
      const wizardState = ctx.wizard.state as SendWizardState;
      
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'cancel_send' || data === 'main_menu') {
          await ctx.answerCbQuery('Send operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data.startsWith('network_')) {
          const walletId = data.split('_')[1];
          const selectedWallet = wizardState.wallets?.find(w => w.walletId === walletId || w.network === walletId);
          
          if (selectedWallet) {
            wizardState.network = selectedWallet.network;
            await ctx.answerCbQuery(`Selected ${selectedWallet.network} network`);
            
            try {
              // Get transfer fee
              const accessToken = ctx.session.auth?.accessToken;
              if (!accessToken) {
                throw new Error('No access token found');
              }
              
              const feeResponse = await getTransferFee(
                accessToken,
                wizardState.amount!,
                wizardState.network!,
                wizardState.method === 'email' ? 'send' : 'wallet'
              );
              
              wizardState.fee = feeResponse.fee;
              wizardState.total = (parseFloat(wizardState.amount!) + parseFloat(feeResponse.fee)).toFixed(2);
              
              // Show confirmation
              let method = wizardState.method === 'email' ? 'Email' : 'Wallet';
              let recipient = truncateWithEllipsis(wizardState.recipient!, 12, 12);
              
              await ctx.reply(
                `📝 *Confirm Transaction*\n\n` +
                `Method: ${method}\n` +
                `Recipient: ${recipient}\n` +
                `Amount: ${formatCurrency(parseFloat(wizardState.amount!))}\n` +
                `Network: ${wizardState.network}\n` +
                `Fee: ${formatCurrency(parseFloat(wizardState.fee))}\n` +
                `Total: ${formatCurrency(parseFloat(wizardState.total))}\n\n` +
                `Please confirm this transaction:`,
                {
                  parse_mode: 'Markdown',
                  ...createConfirmButtons('confirm_send', 'cancel_send')
                }
              );
              
              return ctx.wizard.next();
            } catch (error) {
              console.error('Error getting transfer fee:', error);
              await ctx.reply(
                '❌ Error calculating transfer fee. Please try again later.',
                { ...createBackButton('cancel_send') }
              );
            }
          }
        }
      }
    },
    
    // Step 6: Process confirmation and execute transaction
    async (ctx) => {
      const wizardState = ctx.wizard.state as SendWizardState;
      
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'cancel_send') {
          await ctx.answerCbQuery('Send operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data === 'confirm_send') {
          await ctx.answerCbQuery('Processing transaction...');
          
          try {
            // Execute send transaction
            const accessToken = ctx.session.auth?.accessToken;
            if (!accessToken) {
              throw new Error('No access token found');
            }
            
            // Prepare data based on method
            if (wizardState.method === 'email') {
              const response = await sendFunds(accessToken, {
                email: wizardState.recipient!,
                amount: wizardState.amount!,
                network: wizardState.network!
              });
              
              if (response.success) {
                await ctx.reply(
                  `✅ *Transaction Successful*\n\n` +
                  `You have successfully sent ${formatCurrency(parseFloat(wizardState.amount!))} to ${wizardState.recipient}.\n\n` +
                  `Transaction ID: ${response.transferId}\n` +
                  `Status: ${response.status}\n` +
                  `Created: ${new Date(response.createdAt!).toLocaleString()}`,
                  {
                    parse_mode: 'Markdown',
                    ...createBackButton('main_menu')
                  }
                );
              } else {
                throw new Error(response.error || 'Transaction failed');
              }
            } else {
              // For wallet transfers, use withdraw to wallet endpoint
              const response = await sendFunds(accessToken, {
                email: wizardState.recipient!,
                amount: wizardState.amount!,
                network: wizardState.network!
              });
              
              if (response.success) {
                await ctx.reply(
                  `✅ *Transaction Successful*\n\n` +
                  `You have successfully sent ${formatCurrency(parseFloat(wizardState.amount!))} to ${truncateWithEllipsis(wizardState.recipient!, 12, 12)}.\n\n` +
                  `Transaction ID: ${response.transferId}\n` +
                  `Status: ${response.status}\n` +
                  `Created: ${new Date(response.createdAt!).toLocaleString()}`,
                  {
                    parse_mode: 'Markdown',
                    ...createBackButton('main_menu')
                  }
                );
              } else {
                throw new Error(response.error || 'Transaction failed');
              }
            }
            
            // Return to main menu after successful transaction
            return await cancelScene(ctx);
          } catch (error: any) {
            console.error('Transaction error:', error);
            await ctx.reply(
              `❌ *Transaction Failed*\n\n${error.message || 'An error occurred while processing your transaction. Please try again later.'}`,
              {
                parse_mode: 'Markdown',
                ...createBackButton('main_menu')
              }
            );
            return await cancelScene(ctx);
          }
        }
      }
    }
  );

  // Add listeners for the scene
  addSceneListeners(sendScene);

  return [sendScene];
}

/**
 * Add scene-specific listeners
 * @param scene Wizard scene instance
 */
function addSceneListeners(scene: Scenes.WizardScene<CopperxContext>) {
  // Global leave scene action
  scene.action('cancel_send', async (ctx) => {
    await ctx.answerCbQuery('Send operation cancelled');
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