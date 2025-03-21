import { Markup } from 'telegraf';

/**
 * Creates a main menu keyboard
 * @returns Markup keyboard for main menu
 */
export function createMainMenuButtons() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💰 Balance', 'balance'),
      Markup.button.callback('💸 Send', 'send')
    ],
    [
      Markup.button.callback('⬆️ Deposit', 'deposit'),
      Markup.button.callback('⬇️ Withdraw', 'withdraw')
    ],
    [
      Markup.button.callback('🔄 History', 'history'),
      Markup.button.callback('💼 Wallets', 'wallets')
    ],
    [
      Markup.button.callback('👤 Profile', 'profile'),
      Markup.button.callback('📚 Help', 'help')
    ]
  ]);
}

/**
 * Creates a login keyboard
 * @returns Markup keyboard for login screen
 */
export function createLoginButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔑 Login to Copperx', 'login')],
    [Markup.button.url('📝 Sign Up', 'https://copperx.io/signup')],
    [Markup.button.callback('❓ Help', 'help')]
  ]);
}

/**
 * Creates a back button
 * @param action Action for the back button
 * @returns Inline keyboard with back button
 */
export function createBackButton(action: string = 'main_menu') {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back', action)]
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
  // Group buttons in pairs (2 columns)
  const rows = [];
  const chunkedWallets = chunkArray(wallets, 2);
  
  for (const chunk of chunkedWallets) {
    const row = chunk.map(wallet => {
      const network = wallet.network || 'unknown';
      const balance = wallet.balance || '0.00';
      const label = `${network.charAt(0).toUpperCase() + network.slice(1)} (${balance})`;
      return Markup.button.callback(label, `${actionPrefix}_${wallet.walletId || wallet.network}`);
    });
    rows.push(row);
  }
  
  rows.push([Markup.button.callback('🔙 Back', 'main_menu')]);
  return Markup.inlineKeyboard(rows);
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
  
  if (currentPage > 1) {
    buttons.push(Markup.button.callback('⬅️ Previous', `${actionPrefix}_${currentPage - 1}`));
  }
  
  buttons.push(Markup.button.callback(`${currentPage}/${totalPages}`, 'noop'));
  
  if (currentPage < totalPages) {
    buttons.push(Markup.button.callback('Next ➡️', `${actionPrefix}_${currentPage + 1}`));
  }
  
  return Markup.inlineKeyboard([
    buttons,
    [Markup.button.callback('🔙 Back', 'main_menu')]
  ]);
}

/**
 * Creates transaction history filter buttons
 * @param currentFilter Current active filter
 * @returns Inline keyboard with filter buttons
 */
export function createHistoryFilterButtons(currentFilter?: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(currentFilter === 'all' ? '✅ All' : 'All', 'history_filter_all'),
      Markup.button.callback(currentFilter === 'deposit' ? '✅ Deposits' : 'Deposits', 'history_filter_deposit')
    ],
    [
      Markup.button.callback(currentFilter === 'send' ? '✅ Sent' : 'Sent', 'history_filter_send'),
      Markup.button.callback(currentFilter === 'withdraw' ? '✅ Withdrawals' : 'Withdrawals', 'history_filter_withdraw')
    ],
    [Markup.button.callback('🔄 Refresh', 'history_refresh')],
    [Markup.button.callback('🔙 Back', 'main_menu')]
  ]);
}

/**
 * Creates KYC status actions based on current status
 * @param status Current KYC status
 * @returns Inline keyboard with appropriate KYC actions
 */
export function createKycActionButtons(status: string) {
  const buttons = [];
  
  if (status === 'not_started' || status === 'rejected') {
    buttons.push([Markup.button.url('🔍 Start Verification', 'https://copperx.io/kyc')]);
  } else if (status === 'pending') {
    buttons.push([Markup.button.callback('🔄 Check Status', 'kyc_check')]);
  } else if (status === 'verified') {
    buttons.push([Markup.button.callback('🏆 View Limits', 'kyc_limits')]);
  } else if (status === 'expired') {
    buttons.push([Markup.button.url('🔄 Renew Verification', 'https://copperx.io/kyc')]);
  }
  
  buttons.push([Markup.button.callback('🔙 Back', 'main_menu')]);
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
      Markup.button.callback('📋 Copy Address', `copy_${address}`),
      Markup.button.callback('🔄 Refresh', `deposit_${network}`)
    ],
    [Markup.button.callback('🔙 Back', 'deposit')]
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
      Markup.button.callback('⬆️ Deposit', `deposit_${wallet.network}`),
      Markup.button.callback('⬇️ Withdraw', `withdraw_from_${wallet.walletId || wallet.network}`)
    ],
    [
      Markup.button.callback('💸 Send', `send_from_${wallet.walletId || wallet.network}`),
      Markup.button.callback('📊 Transactions', `history_${wallet.network}`)
    ],
    [
      Markup.button.callback('⭐ Set as Default', `set_default_${wallet.walletId || wallet.network}`),
      Markup.button.callback('🔙 Back', 'wallets')
    ]
  ]);
}

// Helper function to chunk array into smaller arrays
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}