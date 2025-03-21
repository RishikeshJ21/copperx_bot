import { Scenes } from 'telegraf';
import { CopperxContext } from '../models';
import { 
  isValidWalletAddress, 
  isValidAmount, 
  isValidBankDetails 
} from '../utils/validation';
import { formatCurrency, truncateWithEllipsis } from '../utils/format';
import { 
  createBackButton, 
  createConfirmButtons, 
  createWalletNetworkButtons 
} from '../utils/markup';
import { getWalletBalances } from '../api/wallet';
import { 
  getTransferFee, 
  withdrawToWallet, 
  withdrawToBank 
} from '../api/transfer';
import { requireAuth } from '../middleware/auth';

// Define scene state interface
interface WithdrawWizardState extends Scenes.WizardSessionData {
  method?: 'wallet' | 'bank';
  recipient?: string;
  amount?: string;
  network?: string;
  fee?: string;
  wallets?: any[];
  total?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    country?: string;
  };
}

/**
 * Register withdraw scene with Telegraf
 * @returns Array of scenes to be registered with the bot
 */
export function registerWithdrawScene(): Scenes.WizardScene<CopperxContext>[] {
  const withdrawScene = new Scenes.WizardScene<CopperxContext>(
    'withdraw_scene',
    // Step 1: Choose method (wallet or bank)
    async (ctx) => {
      // Apply auth middleware
      await requireAuth(ctx, async () => {
        // Initialize or reset wizard state
        ctx.wizard.state = {};
        
        await ctx.reply(
          '⬇️ *Withdraw Funds*\nChoose a method to withdraw your funds:',
          {
            parse_mode: 'Markdown',
            ...Scenes.WizardScene.markup.inlineKeyboard([
              [
                Scenes.WizardScene.markup.button.callback('🔑 To Wallet', 'method_wallet'),
                Scenes.WizardScene.markup.button.callback('🏦 To Bank', 'method_bank')
              ],
              [Scenes.WizardScene.markup.button.callback('❌ Cancel', 'cancel_withdraw')]
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
        
        if (data === 'cancel_withdraw') {
          await ctx.answerCbQuery('Withdraw operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data === 'method_wallet' || data === 'method_bank') {
          const wizardState = ctx.wizard.state as WithdrawWizardState;
          wizardState.method = data === 'method_wallet' ? 'wallet' : 'bank';
          
          await ctx.answerCbQuery(`Selected ${wizardState.method} method`);
          
          if (wizardState.method === 'wallet') {
            await ctx.reply(
              '🔑 *Withdraw to Wallet*\n\nEnter the wallet address where you want to withdraw your funds:',
              {
                parse_mode: 'Markdown',
                ...createBackButton('cancel_withdraw')
              }
            );
          } else {
            await ctx.reply(
              '🏦 *Withdraw to Bank*\n\nWe\'ll need to collect your bank details. First, let\'s set the amount to withdraw.',
              {
                parse_mode: 'Markdown',
                ...createBackButton('cancel_withdraw')
              }
            );
            
            // For bank withdrawals, skip to amount step
            wizardState.recipient = 'bank';
            ctx.wizard.next();
            
            // Get wallet balances
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
                `💰 *Withdrawal Amount*\n\nEnter the amount you want to withdraw to your bank account:`,
                {
                  parse_mode: 'Markdown',
                  ...createBackButton('cancel_withdraw')
                }
              );
              
              return ctx.wizard.next();
            } catch (error) {
              console.error('Error fetching wallets:', error);
              await ctx.reply(
                '❌ Error fetching your wallet information. Please try again later.',
                { ...createBackButton('cancel_withdraw') }
              );
              return await cancelScene(ctx);
            }
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
              Scenes.WizardScene.markup.button.callback('🔑 To Wallet', 'method_wallet'),
              Scenes.WizardScene.markup.button.callback('🏦 To Bank', 'method_bank')
            ],
            [Scenes.WizardScene.markup.button.callback('❌ Cancel', 'cancel_withdraw')]
          ])
        }
      );
    },
    
    // Step 3: Process recipient and ask for amount
    async (ctx) => {
      const wizardState = ctx.wizard.state as WithdrawWizardState;
      
      // Skip for bank method as it jumps directly to amount step
      if (wizardState.method === 'bank') {
        return;
      }
      
      // Handle text input for recipient
      if (ctx.message && 'text' in ctx.message) {
        const recipient = ctx.message.text;
        
        // Validate wallet address
        if (!isValidWalletAddress(recipient)) {
          await ctx.reply(
            '❌ Invalid wallet address. Please enter a valid address:',
            { ...createBackButton('cancel_withdraw') }
          );
          return;
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
            `💰 *Withdrawal Amount*\n\nEnter the amount you want to withdraw to ${truncateWithEllipsis(recipient)}:`,
            {
              parse_mode: 'Markdown',
              ...createBackButton('cancel_withdraw')
            }
          );
          
          return ctx.wizard.next();
        } catch (error) {
          console.error('Error fetching wallets:', error);
          await ctx.reply(
            '❌ Error fetching your wallet information. Please try again later.',
            { ...createBackButton('cancel_withdraw') }
          );
        }
      } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        if (ctx.callbackQuery.data === 'cancel_withdraw') {
          await ctx.answerCbQuery('Withdraw operation cancelled');
          return await cancelScene(ctx);
        }
      }
    },
    
    // Step 4: Process amount 
    async (ctx) => {
      const wizardState = ctx.wizard.state as WithdrawWizardState;
      
      // Handle text input for amount
      if (ctx.message && 'text' in ctx.message) {
        const amount = ctx.message.text;
        
        // Validate amount
        if (!isValidAmount(amount)) {
          await ctx.reply(
            '❌ Invalid amount. Please enter a valid number:',
            { ...createBackButton('cancel_withdraw') }
          );
          return;
        }
        
        // Check if we have enough funds
        if (wizardState.wallets) {
          let sufficientFunds = false;
          for (const wallet of wizardState.wallets) {
            if (parseFloat(wallet.balance) >= parseFloat(amount)) {
              sufficientFunds = true;
              break;
            }
          }
          
          if (!sufficientFunds) {
            await ctx.reply(
              '❌ Insufficient funds in any of your wallets for this withdrawal.',
              { ...createBackButton('cancel_withdraw') }
            );
            return;
          }
        }
        
        // Save amount
        wizardState.amount = amount;
        
        // For bank withdrawals, ask for bank details
        if (wizardState.method === 'bank') {
          wizardState.bankDetails = {};
          
          await ctx.reply(
            '🏦 *Bank Account Details*\n\n' +
            'Please enter your bank details in the following format:\n\n' +
            'Bank Name: [Your Bank Name]\n' +
            'Account Holder: [Account Holder Name]\n' +
            'Account Number: [Account Number]\n' +
            'Routing/SWIFT: [Routing Number or SWIFT Code]\n' +
            'Country: [Country]',
            {
              parse_mode: 'Markdown',
              ...createBackButton('cancel_withdraw')
            }
          );
          
          return ctx.wizard.next();
        }
        
        // For wallet withdrawals, show network selection
        if (wizardState.wallets && wizardState.wallets.length > 0) {
          await ctx.reply(
            '🌐 *Select Network*\n\nChoose the network you want to withdraw from:',
            {
              parse_mode: 'Markdown',
              ...createWalletNetworkButtons(wizardState.wallets, 'withdraw_network')
            }
          );
          
          return ctx.wizard.next();
        } else {
          await ctx.reply(
            '❌ You don\'t have any wallets available for withdrawals. Please add funds first.',
            { ...createBackButton('main_menu') }
          );
          return await cancelScene(ctx);
        }
      } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        if (ctx.callbackQuery.data === 'cancel_withdraw') {
          await ctx.answerCbQuery('Withdraw operation cancelled');
          return await cancelScene(ctx);
        }
      }
    },
    
    // Step 5: Process bank details or network selection
    async (ctx) => {
      const wizardState = ctx.wizard.state as WithdrawWizardState;
      
      // For bank withdrawals
      if (wizardState.method === 'bank') {
        if (ctx.message && 'text' in ctx.message) {
          const bankDetailsText = ctx.message.text;
          
          // Validate bank details
          if (!isValidBankDetails(bankDetailsText)) {
            await ctx.reply(
              '❌ Invalid bank details. Please provide all required information:',
              { ...createBackButton('cancel_withdraw') }
            );
            return;
          }
          
          // Parse bank details
          const bankNameMatch = bankDetailsText.match(/Bank Name:\s*([^\n]+)/i);
          const accountHolderMatch = bankDetailsText.match(/Account Holder:\s*([^\n]+)/i);
          const accountNumberMatch = bankDetailsText.match(/Account Number:\s*([^\n]+)/i);
          const routingMatch = bankDetailsText.match(/Routing\/SWIFT:\s*([^\n]+)/i);
          const countryMatch = bankDetailsText.match(/Country:\s*([^\n]+)/i);
          
          wizardState.bankDetails = {
            bankName: bankNameMatch?.[1]?.trim(),
            accountName: accountHolderMatch?.[1]?.trim(),
            accountNumber: accountNumberMatch?.[1]?.trim(),
            routingNumber: routingMatch?.[1]?.trim(),
            country: countryMatch?.[1]?.trim(),
          };
          
          // Show network selection
          if (wizardState.wallets && wizardState.wallets.length > 0) {
            await ctx.reply(
              '🌐 *Select Network*\n\nChoose the network you want to withdraw from:',
              {
                parse_mode: 'Markdown',
                ...createWalletNetworkButtons(wizardState.wallets, 'withdraw_network')
              }
            );
          } else {
            await ctx.reply(
              '❌ You don\'t have any wallets available for withdrawals. Please add funds first.',
              { ...createBackButton('main_menu') }
            );
            return await cancelScene(ctx);
          }
        } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
          if (ctx.callbackQuery.data === 'cancel_withdraw') {
            await ctx.answerCbQuery('Withdraw operation cancelled');
            return await cancelScene(ctx);
          }
        }
      }
      // For wallet withdrawals - handle network selection
      else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'cancel_withdraw' || data === 'main_menu') {
          await ctx.answerCbQuery('Withdraw operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data.startsWith('withdraw_network_')) {
          const walletId = data.split('withdraw_network_')[1];
          const selectedWallet = wizardState.wallets?.find(w => w.walletId === walletId || w.network === walletId);
          
          if (selectedWallet) {
            wizardState.network = selectedWallet.network;
            await ctx.answerCbQuery(`Selected ${selectedWallet.network} network`);
            
            // Skip to confirmation step
            return ctx.wizard.next();
          }
        }
      }
      
      return ctx.wizard.next();
    },
    
    // Step 6: Process network selection and show confirmation
    async (ctx) => {
      const wizardState = ctx.wizard.state as WithdrawWizardState;
      
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'cancel_withdraw' || data === 'main_menu') {
          await ctx.answerCbQuery('Withdraw operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data.startsWith('withdraw_network_')) {
          const walletId = data.split('withdraw_network_')[1];
          const selectedWallet = wizardState.wallets?.find(w => w.walletId === walletId || w.network === walletId);
          
          if (selectedWallet) {
            wizardState.network = selectedWallet.network;
            await ctx.answerCbQuery(`Selected ${selectedWallet.network} network`);
          }
        }
      }
      
      // Calculate fees and show confirmation
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
          wizardState.method === 'wallet' ? 'withdraw' : 'bank'
        );
        
        wizardState.fee = feeResponse.fee;
        wizardState.total = (parseFloat(wizardState.amount!) + parseFloat(feeResponse.fee)).toFixed(2);
        
        // Show confirmation
        let confirmationMessage = '';
        
        if (wizardState.method === 'wallet') {
          confirmationMessage = 
            `📝 *Confirm Wallet Withdrawal*\n\n` +
            `Recipient: ${truncateWithEllipsis(wizardState.recipient!, 12, 12)}\n` +
            `Amount: ${formatCurrency(parseFloat(wizardState.amount!))}\n` +
            `Network: ${wizardState.network}\n` +
            `Fee: ${formatCurrency(parseFloat(wizardState.fee))}\n` +
            `Total: ${formatCurrency(parseFloat(wizardState.total))}\n\n` +
            `Please confirm this withdrawal:`;
        } else {
          confirmationMessage = 
            `📝 *Confirm Bank Withdrawal*\n\n` +
            `Bank: ${wizardState.bankDetails?.bankName}\n` +
            `Account: ${wizardState.bankDetails?.accountName}\n` +
            `Account #: ${wizardState.bankDetails?.accountNumber}\n` +
            `Amount: ${formatCurrency(parseFloat(wizardState.amount!))}\n` +
            `Network: ${wizardState.network}\n` +
            `Fee: ${formatCurrency(parseFloat(wizardState.fee))}\n` +
            `Total: ${formatCurrency(parseFloat(wizardState.total))}\n\n` +
            `Please confirm this withdrawal:`;
        }
        
        await ctx.reply(
          confirmationMessage,
          {
            parse_mode: 'Markdown',
            ...createConfirmButtons('confirm_withdraw', 'cancel_withdraw')
          }
        );
        
        return ctx.wizard.next();
      } catch (error) {
        console.error('Error getting transfer fee:', error);
        await ctx.reply(
          '❌ Error calculating withdrawal fee. Please try again later.',
          { ...createBackButton('cancel_withdraw') }
        );
      }
    },
    
    // Step 7: Process confirmation and execute transaction
    async (ctx) => {
      const wizardState = ctx.wizard.state as WithdrawWizardState;
      
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        
        if (data === 'cancel_withdraw') {
          await ctx.answerCbQuery('Withdraw operation cancelled');
          return await cancelScene(ctx);
        }
        
        if (data === 'confirm_withdraw') {
          await ctx.answerCbQuery('Processing withdrawal...');
          
          try {
            // Execute withdrawal transaction
            const accessToken = ctx.session.auth?.accessToken;
            if (!accessToken) {
              throw new Error('No access token found');
            }
            
            let response;
            
            // Prepare data based on method
            if (wizardState.method === 'wallet') {
              response = await withdrawToWallet(accessToken, {
                address: wizardState.recipient!,
                amount: wizardState.amount!,
                network: wizardState.network!
              });
            } else {
              // For bank withdrawals
              response = await withdrawToBank(accessToken, {
                amount: wizardState.amount!,
                network: wizardState.network!,
                bankName: wizardState.bankDetails?.bankName || '',
                accountName: wizardState.bankDetails?.accountName || '',
                accountNumber: wizardState.bankDetails?.accountNumber || '',
                routingNumber: wizardState.bankDetails?.routingNumber || '',
                country: wizardState.bankDetails?.country || ''
              });
            }
            
            if (response.success) {
              let successMessage;
              
              if (wizardState.method === 'wallet') {
                successMessage = `✅ *Withdrawal Successful*\n\n` +
                  `You have successfully initiated a withdrawal of ${formatCurrency(parseFloat(wizardState.amount!))} to ${truncateWithEllipsis(wizardState.recipient!, 12, 12)}.\n\n` +
                  `Transaction ID: ${response.transferId}\n` +
                  `Status: ${response.status}\n` +
                  `Created: ${new Date(response.createdAt!).toLocaleString()}`;
              } else {
                successMessage = `✅ *Bank Withdrawal Initiated*\n\n` +
                  `You have successfully initiated a bank withdrawal of ${formatCurrency(parseFloat(wizardState.amount!))}\n\n` +
                  `Bank: ${wizardState.bankDetails?.bankName}\n` +
                  `Account: ${truncateWithEllipsis(wizardState.bankDetails?.accountNumber || '', 6, 4)}\n` +
                  `Transaction ID: ${response.transferId}\n` +
                  `Status: ${response.status}\n` +
                  `Created: ${new Date(response.createdAt!).toLocaleString()}`;
              }
              
              await ctx.reply(
                successMessage,
                {
                  parse_mode: 'Markdown',
                  ...createBackButton('main_menu')
                }
              );
            } else {
              throw new Error(response.error || 'Transaction failed');
            }
            
            // Return to main menu after successful transaction
            return await cancelScene(ctx);
          } catch (error: any) {
            console.error('Transaction error:', error);
            await ctx.reply(
              `❌ *Withdrawal Failed*\n\n${error.message || 'An error occurred while processing your withdrawal. Please try again later.'}`,
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
  addSceneListeners(withdrawScene);

  return [withdrawScene];
}

/**
 * Add scene-specific listeners
 * @param scene Wizard scene instance
 */
function addSceneListeners(scene: Scenes.WizardScene<CopperxContext>) {
  // Global leave scene action
  scene.action('cancel_withdraw', async (ctx) => {
    await ctx.answerCbQuery('Withdraw operation cancelled');
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