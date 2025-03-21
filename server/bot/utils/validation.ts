/**
 * Validates an email address
 * @param email Email address to validate
 * @returns True if the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) {
    return false;
  }
  
  // Basic regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a wallet address
 * @param address Wallet address to validate
 * @returns True if the address has a valid format
 */
export function isValidWalletAddress(address: string): boolean {
  if (!address) {
    return false;
  }
  
  // Basic check for length and valid characters
  // In a real implementation, network specific address validation would be needed
  if (address.length < 26 || address.length > 64) {
    return false;
  }
  
  // Check for basic alphanumeric characters
  return /^[a-zA-Z0-9]+$/.test(address);
}

/**
 * Validates an amount value
 * @param amount Amount string to validate
 * @returns True if the amount is a valid number
 */
export function isValidAmount(amount: string): boolean {
  if (!amount) {
    return false;
  }
  
  // Check if it's a valid positive number with up to 8 decimal places
  const amountRegex = /^(?!0\d)(\d+)?(?:\.\d{1,8})?$/;
  
  if (!amountRegex.test(amount)) {
    return false;
  }
  
  // Ensure the value is greater than zero
  const numberAmount = parseFloat(amount);
  return !isNaN(numberAmount) && numberAmount > 0;
}

/**
 * Validates OTP format
 * @param otp OTP to validate
 * @returns True if the OTP has a valid format
 */
export function isValidOTP(otp: string): boolean {
  if (!otp) {
    return false;
  }
  
  // Check if OTP is 6 digits
  return /^\d{6}$/.test(otp);
}

/**
 * Validates bank account details format
 * @param bankDetails Bank details text to validate
 * @returns True if the bank details have enough information
 */
export function isValidBankDetails(bankDetails: string): boolean {
  if (!bankDetails) {
    return false;
  }
  
  // Check if it contains minimum required fields
  // This is a simple check; in real scenario would need proper parsing and validation
  const requiredTerms = ['account', 'bank', 'name'];
  const lowerCaseDetails = bankDetails.toLowerCase();
  
  let foundCount = 0;
  for (const term of requiredTerms) {
    if (lowerCaseDetails.includes(term)) {
      foundCount++;
    }
  }
  
  return foundCount >= 2;
}

/**
 * Validates a transaction ID format
 * @param transactionId Transaction ID to validate
 * @returns True if the transaction ID has a valid format
 */
export function isValidTransactionId(transactionId: string): boolean {
  if (!transactionId) {
    return false;
  }
  
  // Check if it's a valid alphanumeric with hyphens
  // UUID format or similar transaction ID format
  return /^[a-zA-Z0-9\-]{8,36}$/.test(transactionId);
}

/**
 * Checks if a number is within a valid range
 * @param value Number to check
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns True if the value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return !isNaN(value) && value >= min && value <= max;
}

/**
 * Validates network name
 * @param network Network name to validate
 * @param validNetworks Optional array of valid networks
 * @returns True if the network is valid
 */
export function isValidNetwork(network: string, validNetworks?: string[]): boolean {
  if (!network) {
    return false;
  }
  
  if (validNetworks && validNetworks.length > 0) {
    return validNetworks.includes(network.toLowerCase());
  }
  
  // Basic check for common networks
  const commonNetworks = ['ethereum', 'solana', 'polygon', 'bsc', 'avalanche', 'bitcoin'];
  return commonNetworks.includes(network.toLowerCase());
}

/**
 * Validates a phone number format
 * @param phone Phone number to validate
 * @returns True if the phone number has a valid format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) {
    return false;
  }
  
  // International phone number regex
  // Allows +, spaces, dashes, parentheses
  // Between 8-15 digits
  return /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,8}$/.test(phone);
}

/**
 * Validates if a string contains only alphanumeric characters
 * @param str String to validate
 * @returns True if the string is alphanumeric
 */
export function isAlphanumeric(str: string): boolean {
  if (!str) {
    return false;
  }
  
  return /^[a-zA-Z0-9]+$/.test(str);
}