/**
 * Validates an email address
 * @param email Email address to validate
 * @returns True if the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a wallet address
 * @param address Wallet address to validate
 * @returns True if the address has a valid format
 */
export function isValidWalletAddress(address: string): boolean {
  if (!address) return false;
  
  // Basic checks for common blockchain addresses
  // Ethereum-like (42 chars, starts with 0x)
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true;
  
  // Solana (32-44 chars base58)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return true;
  
  // Tron (34 chars, starts with T)
  if (/^T[A-Za-z1-9]{33}$/.test(address)) return true;
  
  // General check for reasonable length
  return address.length >= 24 && address.length <= 64;
}

/**
 * Validates an amount value
 * @param amount Amount string to validate
 * @returns True if the amount is a valid number
 */
export function isValidAmount(amount: string): boolean {
  if (!amount) return false;
  
  // Checks for valid number format with up to 6 decimal places
  const amountRegex = /^[0-9]+(\.[0-9]{1,6})?$/;
  if (!amountRegex.test(amount)) return false;
  
  // Convert to number and check if it's positive
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Validates OTP format
 * @param otp OTP to validate
 * @returns True if the OTP has a valid format
 */
export function isValidOTP(otp: string): boolean {
  if (!otp) return false;
  
  // Typically 6 digits, but allow 4-8 digits for flexibility
  const otpRegex = /^[0-9]{4,8}$/;
  return otpRegex.test(otp);
}

/**
 * Validates bank account details format
 * @param bankDetails Bank details text to validate
 * @returns True if the bank details have enough information
 */
export function isValidBankDetails(bankDetails: string): boolean {
  if (!bankDetails) return false;
  
  // Minimum length check to ensure enough details are provided
  return bankDetails.length >= 20;
}

/**
 * Validates a transaction ID format
 * @param transactionId Transaction ID to validate
 * @returns True if the transaction ID has a valid format
 */
export function isValidTransactionId(transactionId: string): boolean {
  if (!transactionId) return false;
  
  // Uuid v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // Hex format (common for blockchain txids)
  const hexRegex = /^0x[a-f0-9]{64}$/i;
  
  // General alphanumeric format with reasonable length
  const generalRegex = /^[a-z0-9]{8,64}$/i;
  
  return uuidRegex.test(transactionId) || hexRegex.test(transactionId) || generalRegex.test(transactionId);
}

/**
 * Checks if a number is within a valid range
 * @param value Number to check
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns True if the value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates network name
 * @param network Network name to validate
 * @param validNetworks Optional array of valid networks
 * @returns True if the network is valid
 */
export function isValidNetwork(network: string, validNetworks?: string[]): boolean {
  if (!network) return false;
  
  // If list of valid networks provided, check against it
  if (validNetworks && validNetworks.length > 0) {
    return validNetworks.includes(network.toLowerCase());
  }
  
  // Default basic check for common networks
  const commonNetworks = ['ethereum', 'solana', 'bitcoin', 'polygon', 'bnb', 'avalanche', 'arbitrum'];
  return commonNetworks.includes(network.toLowerCase()) || network.length >= 3;
}

/**
 * Validates a phone number format
 * @param phone Phone number to validate
 * @returns True if the phone number has a valid format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // Allow digits, plus, dash, parentheses, and spaces
  // Minimum 10 characters
  const phoneRegex = /^[0-9\+\-\(\)\s]{10,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates if a string contains only alphanumeric characters
 * @param str String to validate
 * @returns True if the string is alphanumeric
 */
export function isAlphanumeric(str: string): boolean {
  if (!str) return false;
  
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
}

/**
 * Login state for the login flow
 */
export enum LoginStep {
  IDLE = 'idle',
  WAITING_FOR_EMAIL = 'waiting_for_email',
  WAITING_FOR_OTP = 'waiting_for_otp',
}

/**
 * Withdraw step enum
 * Steps in the withdrawal flow
 */
export enum WithdrawStep {
  IDLE = 'idle',
  SELECT_METHOD = 'select_method',
  ENTER_RECIPIENT = 'enter_recipient',
  ENTER_AMOUNT = 'enter_amount',
  ENTER_BANK_DETAILS = 'enter_bank_details',
  SELECT_NETWORK = 'select_network',
  CONFIRM_TRANSACTION = 'confirm_transaction',
}

/**
 * Send step enum
 * Steps in the send flow
 */
export enum SendStep {
  IDLE = 'idle',
  SELECT_METHOD = 'select_method',
  ENTER_RECIPIENT = 'enter_recipient',
  ENTER_AMOUNT = 'enter_amount',
  CONFIRM_TRANSACTION = 'confirm_transaction',
}