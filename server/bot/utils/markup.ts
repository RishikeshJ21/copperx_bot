import { Markup } from 'telegraf';
import { formatWalletAddress, formatNetworkName } from './format';

/**
 * Creates a main menu keyboard
 * @returns Markup keyboard for main menu
 */
export function createMainMenuButtons() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💰 Balance', 'balance'),
      Markup.button.callback('🏦 Wallets', 'wallets')
    ],
    [
      Markup.button.callback('📤 Send', 'send'),
      Markup.button.callback('💸 Withdraw', 'withdraw'),
      Markup.button.callback('📥 Deposit', 'deposit')
    ],
    [
      Markup.button.callback('📋 History', 'history'),
      Markup.button.callback('👤 Profile', 'profile'),
      Markup.button.callback('🔐 KYC', 'kyc')
    ],
    [
      Markup.button.callback('ℹ️ Help', 'help')
    ]
  ]);
}

/**
 * Creates a login keyboard
 * @returns Markup keyboard for login screen
 */
export function createLoginButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔑 Login with Email', 'login_email')],
    [Markup.button.callback('ℹ️ Help', 'help')]
  ]);
}

/**
 * Creates a back button
 * @param action Action for the back button
 * @returns Inline keyboard with back button
 */
export function createBackButton(action: string = 'main_menu') {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back', action)]
  ]);
}

/**
 * Creates a cancel button
 * @param action Action for the cancel button
 * @returns Inline keyboard with cancel button
 */
export function createCancelButton(action: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❌ Cancel', action)]
  ]);
}

/**
 * Creates confirmation buttons
 * @param confirmAction Action for confirm button
 * @param cancelAction Action for cancel button
 * @returns Inline keyboard with confirm and cancel buttons
 */
export function createConfirmButtons(confirmAction: string, cancelAction: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Confirm', confirmAction),
      Markup.button.callback('❌ Cancel', cancelAction)
    ]
  ]);
}

/**
 * Creates wallet network selection buttons
 * @param wallets Array of wallet objects
 * @param actionPrefix Prefix for the callback action
 * @returns Inline keyboard with wallet selection buttons
 */
export function createWalletNetworkButtons(wallets: any[], actionPrefix: string) {
  const buttons = wallets.map(wallet => {
    // Format button text based on wallet properties
    const networkName = formatNetworkName(wallet.network);
    const balanceText = wallet.balance ? wallet.balance : '0.00';
    const buttonText = `${networkName} (${balanceText} USDC)`;
    
    // Create callback data with wallet ID
    return [Markup.button.callback(buttonText, `${actionPrefix}_${wallet.walletId}`)];
  });
  
  // Add back button
  buttons.push([Markup.button.callback('⬅️ Back', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Creates pagination buttons
 * @param currentPage Current page number
 * @param totalPages Total number of pages
 * @param actionPrefix Prefix for the callback action
 * @returns Inline keyboard with pagination buttons
 */
export function createPaginationButtons(currentPage: number, totalPages: number, actionPrefix: string) {
  const buttons = [];
  const navRow = [];
  
  // Add previous page button if not on first page
  if (currentPage > 1) {
    navRow.push(Markup.button.callback('⬅️ Prev', `${actionPrefix}_page_${currentPage - 1}`));
  }
  
  // Add current page indicator
  navRow.push(Markup.button.callback(`${currentPage}/${totalPages}`, 'noop'));
  
  // Add next page button if not on last page
  if (currentPage < totalPages) {
    navRow.push(Markup.button.callback('Next ➡️', `${actionPrefix}_page_${currentPage + 1}`));
  }
  
  buttons.push(navRow);
  
  // Add back button
  buttons.push([Markup.button.callback('⬅️ Back', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Creates transaction history filter buttons
 * @param currentFilter Current active filter
 * @returns Inline keyboard with filter buttons
 */
export function createHistoryFilterButtons(currentFilter?: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${currentFilter === 'all' ? '✓ ' : ''}All`, 
        'history_filter_all'
      ),
      Markup.button.callback(
        `${currentFilter === 'deposit' ? '✓ ' : ''}Deposits`, 
        'history_filter_deposit'
      )
    ],
    [
      Markup.button.callback(
        `${currentFilter === 'withdraw' ? '✓ ' : ''}Withdrawals`, 
        'history_filter_withdraw'
      ),
      Markup.button.callback(
        `${currentFilter === 'send' ? '✓ ' : ''}Transfers`, 
        'history_filter_send'
      )
    ],
    [Markup.button.callback('⬅️ Back', 'main_menu')]
  ]);
}

/**
 * Creates KYC status actions based on current status
 * @param status Current KYC status
 * @returns Inline keyboard with appropriate KYC actions
 */
export function createKycActionButtons(status: string) {
  const buttons = [];
  
  switch (status.toLowerCase()) {
    case 'not_started':
    case 'notstarted':
      buttons.push([Markup.button.callback('🚀 Start KYC Verification', 'kyc_start')]);
      break;
      
    case 'pending':
      buttons.push([Markup.button.callback('🔄 Check Status', 'kyc_check')]);
      break;
      
    case 'rejected':
      buttons.push([Markup.button.callback('🔄 Re-submit KYC', 'kyc_start')]);
      buttons.push([Markup.button.callback('❓ Why Rejected', 'kyc_why_rejected')]);
      break;
      
    case 'expired':
      buttons.push([Markup.button.callback('🔄 Renew KYC', 'kyc_start')]);
      break;
      
    case 'verified':
      buttons.push([Markup.button.callback('📋 View KYC Details', 'kyc_details')]);
      break;
      
    default:
      buttons.push([Markup.button.callback('❓ Check Status', 'kyc_check')]);
  }
  
  // Add back button
  buttons.push([Markup.button.callback('⬅️ Back', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Creates buttons for deposit address actions
 * @param network Network of the deposit address
 * @param address Deposit address
 * @returns Inline keyboard with deposit address actions
 */
export function createDepositAddressButtons(network: string, address: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📋 Copy Address', `copy_address_${network}`),
      Markup.button.callback('🔄 Refresh', `deposit_refresh_${network}`)
    ],
    [Markup.button.callback('⬅️ Back', 'main_menu')]
  ]);
}

/**
 * Creates buttons for wallet actions
 * @param wallet Wallet object
 * @returns Inline keyboard with wallet action buttons
 */
export function createWalletActionButtons(wallet: any) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📥 Deposit', `deposit_${wallet.network}`),
      Markup.button.callback('📤 Send', `send_${wallet.network}`),
      Markup.button.callback('💸 Withdraw', `withdraw_${wallet.network}`)
    ],
    [
      Markup.button.callback(
        wallet.isDefault ? '✓ Default Wallet' : '📌 Set as Default',
        `set_default_wallet_${wallet.walletId}`
      )
    ],
    [Markup.button.callback('⬅️ Back', 'wallets')]
  ]);
}