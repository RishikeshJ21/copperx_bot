import { Markup } from 'telegraf';
import { Scenes } from 'telegraf';
import { CopperxContext } from '../models';
import { Account, BankAccount, getAllAccounts, createAccount, getAccountById, deleteAccount, formatAccountForDisplay } from '../api/account';
import { createSceneNavigation, exitScene, formatErrorMessage, handleSceneAuth } from './utils';
import { SCENE_IDS } from './config';
import { isValidBankDetails } from '../utils/validation';

/**
 * Scene wizard session data
 */
interface AccountWizardState extends Scenes.WizardSessionData {
  accounts?: Account[];
  selectedAccountId?: string;
  newAccount?: {
    country?: string;
    bankAccount?: Partial<BankAccount>;
    isDefault?: boolean;
    step: string;
  };
  currentPage?: number;
}

/**
 * Register account management scene
 * @returns Account management wizard scene
 */
export function registerAccountScene(): Scenes.WizardScene<CopperxContext>[] {
  // Create account management wizard
  const accountScene = new Scenes.WizardScene<CopperxContext>(
    SCENE_IDS.ACCOUNT_MANAGEMENT,
    // Step 0: Show account list or options
    async (ctx) => {
      await handleSceneAuth(ctx, async () => {
        // Initialize wizard state
        const wizardState = ctx.scene.session.state as AccountWizardState;
        wizardState.currentPage = 1;
        
        await showAccountList(ctx);
      });
    },
    // Step 1: Handle account selection or creating new account
    async (ctx) => {
      await handleSceneAuth(ctx, async () => {
        const wizardState = ctx.scene.session.state as AccountWizardState;
        
        // If user wants to create a new account
        if (wizardState.newAccount?.step === 'country') {
          // User is providing country for new account
          if (ctx.message?.text) {
            wizardState.newAccount.country = ctx.message.text.trim();
            wizardState.newAccount.step = 'bank_name';
            
            await ctx.reply(
              '🏦 Please enter the bank name:',
              createSceneNavigation('cancel_account')
            );
          } else {
            await ctx.reply(
              '❌ Please enter a valid country name.',
              createSceneNavigation('cancel_account')
            );
          }
          return;
        }
        
        if (wizardState.newAccount?.step === 'bank_name') {
          // User is providing bank name
          if (ctx.message?.text) {
            if (!wizardState.newAccount.bankAccount) {
              wizardState.newAccount.bankAccount = {};
            }
            
            wizardState.newAccount.bankAccount.bankName = ctx.message.text.trim();
            wizardState.newAccount.step = 'bank_type';
            
            // Ask for bank account type with predefined options
            await ctx.reply(
              '🏦 Select the bank account type:',
              Markup.inlineKeyboard([
                [
                  Markup.button.callback('Savings', 'bank_type_savings'),
                  Markup.button.callback('Checking', 'bank_type_checking')
                ],
                [
                  Markup.button.callback('Current', 'bank_type_current'),
                  Markup.button.callback('❌ Cancel', 'cancel_account')
                ]
              ])
            );
          } else {
            await ctx.reply(
              '❌ Please enter a valid bank name.',
              createSceneNavigation('cancel_account')
            );
          }
          return;
        }
        
        if (wizardState.newAccount?.step === 'routing_number') {
          // User is providing routing number
          if (ctx.message?.text) {
            if (!wizardState.newAccount.bankAccount) {
              wizardState.newAccount.bankAccount = {};
            }
            
            wizardState.newAccount.bankAccount.bankRoutingNumber = ctx.message.text.trim();
            wizardState.newAccount.step = 'account_number';
            
            await ctx.reply(
              '🔢 Please enter your bank account number:',
              createSceneNavigation('cancel_account')
            );
          } else {
            await ctx.reply(
              '❌ Please enter a valid routing number.',
              createSceneNavigation('cancel_account')
            );
          }
          return;
        }
        
        if (wizardState.newAccount?.step === 'account_number') {
          // User is providing account number
          if (ctx.message?.text) {
            if (!wizardState.newAccount.bankAccount) {
              wizardState.newAccount.bankAccount = {};
            }
            
            wizardState.newAccount.bankAccount.bankAccountNumber = ctx.message.text.trim();
            wizardState.newAccount.step = 'beneficiary_name';
            
            await ctx.reply(
              '👤 Please enter the account beneficiary name (usually your full name):',
              createSceneNavigation('cancel_account')
            );
          } else {
            await ctx.reply(
              '❌ Please enter a valid account number.',
              createSceneNavigation('cancel_account')
            );
          }
          return;
        }
        
        if (wizardState.newAccount?.step === 'beneficiary_name') {
          // User is providing beneficiary name
          if (ctx.message?.text) {
            if (!wizardState.newAccount.bankAccount) {
              wizardState.newAccount.bankAccount = {};
            }
            
            wizardState.newAccount.bankAccount.bankBeneficiaryName = ctx.message.text.trim();
            wizardState.newAccount.step = 'swift_code';
            
            await ctx.reply(
              '🌐 Please enter your bank SWIFT code (optional - press Skip if you don\'t have it):',
              Markup.inlineKeyboard([
                [Markup.button.callback('Skip', 'skip_swift_code')],
                [Markup.button.callback('❌ Cancel', 'cancel_account')]
              ])
            );
          } else {
            await ctx.reply(
              '❌ Please enter a valid beneficiary name.',
              createSceneNavigation('cancel_account')
            );
          }
          return;
        }
        
        if (wizardState.newAccount?.step === 'swift_code') {
          // User is providing SWIFT code
          if (ctx.message?.text) {
            if (!wizardState.newAccount.bankAccount) {
              wizardState.newAccount.bankAccount = {};
            }
            
            wizardState.newAccount.bankAccount.swiftCode = ctx.message.text.trim();
          }
          
          wizardState.newAccount.step = 'bank_address';
          
          await ctx.reply(
            '🏢 Please enter the bank address (optional - press Skip if you don\'t have it):',
            Markup.inlineKeyboard([
              [Markup.button.callback('Skip', 'skip_bank_address')],
              [Markup.button.callback('❌ Cancel', 'cancel_account')]
            ])
          );
          return;
        }
        
        if (wizardState.newAccount?.step === 'bank_address') {
          // User is providing bank address
          if (ctx.message?.text) {
            if (!wizardState.newAccount.bankAccount) {
              wizardState.newAccount.bankAccount = {};
            }
            
            wizardState.newAccount.bankAccount.bankAddress = ctx.message.text.trim();
          }
          
          // Ask if this should be default account
          wizardState.newAccount.step = 'is_default';
          
          await ctx.reply(
            '🔄 Would you like to set this as your default account?',
            Markup.inlineKeyboard([
              [
                Markup.button.callback('Yes', 'set_default_yes'),
                Markup.button.callback('No', 'set_default_no')
              ],
              [Markup.button.callback('❌ Cancel', 'cancel_account')]
            ])
          );
          return;
        }
        
        if (wizardState.newAccount?.step === 'confirm') {
          // Show summary and ask for confirmation
          if (!wizardState.newAccount.bankAccount) {
            wizardState.newAccount.bankAccount = {};
          }
          
          const bank = wizardState.newAccount.bankAccount;
          const summary = `
🏦 *Bank Account Summary*

Country: ${wizardState.newAccount.country || 'Not specified'}
Bank: ${bank.bankName || 'Not specified'}
Account Type: ${bank.bankAccountType || 'Not specified'}
Routing Number: ${bank.bankRoutingNumber || 'Not specified'}
Account Number: ${maskAccountNumber(bank.bankAccountNumber || '')}
Beneficiary: ${bank.bankBeneficiaryName || 'Not specified'}
${bank.swiftCode ? `SWIFT Code: ${bank.swiftCode}` : ''}
${bank.bankAddress ? `Bank Address: ${bank.bankAddress}` : ''}
Default Account: ${wizardState.newAccount.isDefault ? 'Yes' : 'No'}

Please confirm these details are correct.
          `;
          
          await ctx.reply(
            summary,
            Markup.inlineKeyboard([
              [
                Markup.button.callback('✅ Confirm', 'confirm_create_account'),
                Markup.button.callback('❌ Cancel', 'cancel_account')
              ]
            ])
          );
          return;
        }
      });
    }
  );
  
  // Add listeners for inline buttons
  addAccountSceneListeners(accountScene);
  
  return [accountScene];
}

/**
 * Add listeners for inline buttons in the account scene
 * @param scene The account scene
 */
function addAccountSceneListeners(scene: Scenes.WizardScene<CopperxContext>) {
  // Action to view account details
  scene.action(/account_view_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const accountId = ctx.match[1];
    await showAccountDetails(ctx, accountId);
  });
  
  // Action to delete an account
  scene.action(/account_delete_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const accountId = ctx.match[1];
    await confirmDeleteAccount(ctx, accountId);
  });
  
  // Confirm account deletion
  scene.action(/confirm_delete_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const accountId = ctx.match[1];
    await handleDeleteAccount(ctx, accountId);
  });
  
  // Cancel account deletion
  scene.action('cancel_delete', async (ctx) => {
    await ctx.answerCbQuery();
    await showAccountList(ctx);
  });
  
  // Create new account
  scene.action('create_account', async (ctx) => {
    await ctx.answerCbQuery();
    await startCreateAccount(ctx);
  });
  
  // Back to account list
  scene.action('back_to_accounts', async (ctx) => {
    await ctx.answerCbQuery();
    await showAccountList(ctx);
  });
  
  // Cancel account creation/modification
  scene.action('cancel_account', async (ctx) => {
    await ctx.answerCbQuery();
    // Reset account wizard state
    const wizardState = ctx.scene.session.state as AccountWizardState;
    wizardState.newAccount = undefined;
    wizardState.selectedAccountId = undefined;
    
    await ctx.reply('❌ Operation cancelled.');
    await showAccountList(ctx);
  });
  
  // Handle bank account type selections
  scene.action(/bank_type_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const accountType = ctx.match[1];
    const wizardState = ctx.scene.session.state as AccountWizardState;
    
    if (!wizardState.newAccount?.bankAccount) {
      wizardState.newAccount = {
        ...wizardState.newAccount || {},
        bankAccount: {},
        step: 'bank_type'
      };
    }
    
    wizardState.newAccount.bankAccount.bankAccountType = accountType as 'savings' | 'checking' | 'current';
    wizardState.newAccount.step = 'routing_number';
    
    await ctx.editMessageText(
      `Selected account type: ${accountType}\n\n🔢 Please enter your bank routing number:`,
      createSceneNavigation('cancel_account')
    );
  });
  
  // Skip optional fields
  scene.action('skip_swift_code', async (ctx) => {
    await ctx.answerCbQuery();
    const wizardState = ctx.scene.session.state as AccountWizardState;
    if (wizardState.newAccount) {
      wizardState.newAccount.step = 'bank_address';
      
      await ctx.editMessageText(
        '🏢 Please enter the bank address (optional - press Skip if you don\'t have it):',
        Markup.inlineKeyboard([
          [Markup.button.callback('Skip', 'skip_bank_address')],
          [Markup.button.callback('❌ Cancel', 'cancel_account')]
        ])
      );
    }
  });
  
  scene.action('skip_bank_address', async (ctx) => {
    await ctx.answerCbQuery();
    const wizardState = ctx.scene.session.state as AccountWizardState;
    if (wizardState.newAccount) {
      wizardState.newAccount.step = 'is_default';
      
      await ctx.editMessageText(
        '🔄 Would you like to set this as your default account?',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Yes', 'set_default_yes'),
            Markup.button.callback('No', 'set_default_no')
          ],
          [Markup.button.callback('❌ Cancel', 'cancel_account')]
        ])
      );
    }
  });
  
  // Handle default account setting
  scene.action('set_default_yes', async (ctx) => {
    await ctx.answerCbQuery();
    const wizardState = ctx.scene.session.state as AccountWizardState;
    if (wizardState.newAccount) {
      wizardState.newAccount.isDefault = true;
      wizardState.newAccount.step = 'confirm';
      
      await ctx.wizard.next();
      return ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  });
  
  scene.action('set_default_no', async (ctx) => {
    await ctx.answerCbQuery();
    const wizardState = ctx.scene.session.state as AccountWizardState;
    if (wizardState.newAccount) {
      wizardState.newAccount.isDefault = false;
      wizardState.newAccount.step = 'confirm';
      
      await ctx.wizard.next();
      return ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  });
  
  // Confirm account creation
  scene.action('confirm_create_account', async (ctx) => {
    await ctx.answerCbQuery();
    await createNewAccount(ctx);
  });
  
  // Pagination for account list
  scene.action(/accounts_page_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    const wizardState = ctx.scene.session.state as AccountWizardState;
    wizardState.currentPage = page;
    await showAccountList(ctx, page);
  });
  
  // Exit scene and return to main menu
  scene.action('exit_accounts', async (ctx) => {
    await ctx.answerCbQuery();
    await exitScene(ctx, '🏠 Returning to the main menu.');
  });
}

/**
 * Start the create account flow
 * @param ctx Telegram context
 */
async function startCreateAccount(ctx: CopperxContext) {
  const wizardState = ctx.scene.session.state as AccountWizardState;
  wizardState.newAccount = {
    step: 'country'
  };
  
  await ctx.reply(
    '🌍 Let\'s set up your bank account. First, please enter your country:',
    createSceneNavigation('cancel_account')
  );
}

/**
 * Show the list of accounts
 * @param ctx Telegram context
 * @param page Page number for pagination
 */
async function showAccountList(ctx: CopperxContext, page = 1) {
  try {
    const wizardState = ctx.scene.session.state as AccountWizardState;
    
    // Display loading message
    const loadingMsg = await ctx.reply('🔄 Loading your accounts...');
    
    // Fetch accounts from API
    const accounts = await getAllAccounts(ctx.session.auth!.accessToken);
    wizardState.accounts = accounts;
    wizardState.currentPage = page;
    
    // Delete loading message
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    
    if (accounts.length === 0) {
      await ctx.reply(
        '📝 You don\'t have any accounts yet. Would you like to create one?',
        Markup.inlineKeyboard([
          [Markup.button.callback('➕ Create Account', 'create_account')],
          [Markup.button.callback('🏠 Main Menu', 'exit_accounts')]
        ])
      );
      return;
    }
    
    // Pagination
    const pageSize = 3;
    const totalPages = Math.ceil(accounts.length / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, accounts.length);
    const accountsOnPage = accounts.slice(startIdx, endIdx);
    
    // Create inline keyboard with account actions
    const keyboard = accountsOnPage.map(account => [
      Markup.button.callback(`${getAccountTypeEmoji(account.type)} ${account.bankAccount?.bankName || 'Account'}`, `account_view_${account.id}`)
    ]);
    
    // Add pagination buttons if needed
    if (totalPages > 1) {
      const paginationRow = [];
      
      if (page > 1) {
        paginationRow.push(Markup.button.callback('⬅️ Prev', `accounts_page_${page - 1}`));
      }
      
      paginationRow.push(Markup.button.callback(`${page}/${totalPages}`, 'noop'));
      
      if (page < totalPages) {
        paginationRow.push(Markup.button.callback('Next ➡️', `accounts_page_${page + 1}`));
      }
      
      keyboard.push(paginationRow);
    }
    
    // Add action buttons
    keyboard.push([Markup.button.callback('➕ Create Account', 'create_account')]);
    keyboard.push([Markup.button.callback('🏠 Main Menu', 'exit_accounts')]);
    
    await ctx.reply(
      `🏦 *Your Accounts*\n\nYou have ${accounts.length} account(s). Select an account to view details:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
      }
    );
  } catch (error) {
    await ctx.reply(
      `❌ Error fetching accounts: ${formatErrorMessage(error)}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'back_to_accounts')],
        [Markup.button.callback('🏠 Main Menu', 'exit_accounts')]
      ])
    );
  }
}

/**
 * Show account details
 * @param ctx Telegram context
 * @param accountId Account ID
 */
async function showAccountDetails(ctx: CopperxContext, accountId: string) {
  try {
    const wizardState = ctx.scene.session.state as AccountWizardState;
    let account: Account | undefined;
    
    // Check if we already have the account in the session
    if (wizardState.accounts) {
      account = wizardState.accounts.find(a => a.id === accountId);
    }
    
    // If not found in session, fetch from API
    if (!account) {
      account = await getAccountById(ctx.session.auth!.accessToken, accountId);
    }
    
    if (!account) {
      throw new Error('Account not found');
    }
    
    wizardState.selectedAccountId = accountId;
    
    // Format account details for display
    const accountDetails = formatAccountForDisplay(account);
    
    await ctx.editMessageText(
      `${accountDetails}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🗑️ Delete Account', `account_delete_${accountId}`)],
        [Markup.button.callback('⬅️ Back to Accounts', 'back_to_accounts')],
        [Markup.button.callback('🏠 Main Menu', 'exit_accounts')]
      ])
    );
  } catch (error) {
    await ctx.editMessageText(
      `❌ Error fetching account details: ${formatErrorMessage(error)}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Accounts', 'back_to_accounts')],
        [Markup.button.callback('🏠 Main Menu', 'exit_accounts')]
      ])
    );
  }
}

/**
 * Confirm account deletion
 * @param ctx Telegram context
 * @param accountId Account ID
 */
async function confirmDeleteAccount(ctx: CopperxContext, accountId: string) {
  await ctx.editMessageText(
    '⚠️ *Delete Account*\n\nAre you sure you want to delete this account? This action cannot be undone.',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Yes, delete', `confirm_delete_${accountId}`),
          Markup.button.callback('❌ No, cancel', 'cancel_delete')
        ]
      ])
    }
  );
}

/**
 * Handle account deletion
 * @param ctx Telegram context
 * @param accountId Account ID
 */
async function handleDeleteAccount(ctx: CopperxContext, accountId: string) {
  try {
    // Show loading message
    await ctx.editMessageText('🔄 Deleting account...');
    
    // Delete the account through API
    await deleteAccount(ctx.session.auth!.accessToken, accountId);
    
    await ctx.editMessageText(
      '✅ Account has been successfully deleted.',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Accounts', 'back_to_accounts')]
      ])
    );
  } catch (error) {
    await ctx.editMessageText(
      `❌ Error deleting account: ${formatErrorMessage(error)}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Accounts', 'back_to_accounts')],
        [Markup.button.callback('🏠 Main Menu', 'exit_accounts')]
      ])
    );
  }
}

/**
 * Create a new account
 * @param ctx Telegram context
 */
async function createNewAccount(ctx: CopperxContext) {
  const wizardState = ctx.scene.session.state as AccountWizardState;
  
  if (!wizardState.newAccount) {
    await ctx.editMessageText(
      '❌ Missing account information. Please try again.',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Accounts', 'back_to_accounts')]
      ])
    );
    return;
  }
  
  try {
    // Show loading message
    await ctx.editMessageText('🔄 Creating your account...');
    
    // Create account data object
    const accountData = {
      country: wizardState.newAccount.country!,
      isDefault: wizardState.newAccount.isDefault || false,
      bankAccount: {
        bankName: wizardState.newAccount.bankAccount!.bankName!,
        bankAccountType: wizardState.newAccount.bankAccount!.bankAccountType!,
        bankRoutingNumber: wizardState.newAccount.bankAccount!.bankRoutingNumber!,
        bankAccountNumber: wizardState.newAccount.bankAccount!.bankAccountNumber!,
        bankBeneficiaryName: wizardState.newAccount.bankAccount!.bankBeneficiaryName!,
        method: 'bank',
        ...(wizardState.newAccount.bankAccount!.swiftCode && { swiftCode: wizardState.newAccount.bankAccount!.swiftCode }),
        ...(wizardState.newAccount.bankAccount!.bankAddress && { bankAddress: wizardState.newAccount.bankAccount!.bankAddress })
      }
    };
    
    // Create the account through API
    const account = await createAccount(ctx.session.auth!.accessToken, accountData);
    
    // Reset wizard state
    wizardState.newAccount = undefined;
    
    // Refresh accounts list
    const accounts = await getAllAccounts(ctx.session.auth!.accessToken);
    wizardState.accounts = accounts;
    
    // Show success message
    await ctx.editMessageText(
      '✅ Your bank account has been successfully added!',
      Markup.inlineKeyboard([
        [Markup.button.callback('➡️ View My Accounts', 'back_to_accounts')],
        [Markup.button.callback('🏠 Main Menu', 'exit_accounts')]
      ])
    );
  } catch (error) {
    await ctx.editMessageText(
      `❌ Error creating account: ${formatErrorMessage(error)}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'create_account')],
        [Markup.button.callback('⬅️ Back to Accounts', 'back_to_accounts')]
      ])
    );
  }
}

/**
 * Get emoji for account type
 * @param type Account type
 * @returns Emoji representing the account type
 */
function getAccountTypeEmoji(type: string): string {
  switch (type) {
    case 'web3_wallet':
      return '💼';
    case 'bank':
      return '🏦';
    default:
      return '💳';
  }
}

/**
 * Mask account number for privacy
 * @param accountNumber Full account number
 * @returns Masked account number
 */
function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) {
    return accountNumber;
  }
  
  const lastFour = accountNumber.slice(-4);
  const maskedPart = '•'.repeat(accountNumber.length - 4);
  return maskedPart + lastFour;
}