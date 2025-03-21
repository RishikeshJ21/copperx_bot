/**
 * Auth session data
 * Stores authentication information in the session
 */
export interface AuthSessionData {
  // Access token for API requests
  accessToken: string;
  
  // Token expiration date
  expireAt: Date | string;
  
  // User information
  user?: UserData;
  
  // Organization ID for the user
  organizationId?: string;
}

/**
 * User data interface
 * Contains user profile information
 */
export interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  organizationId?: string;
  role?: 'owner' | 'admin' | 'member' | string;
  status?: 'pending' | 'active' | 'suspended' | string;
  type?: 'individual' | 'business' | string;
  relayerAddress?: string;
  flags?: string[];
  walletAddress?: string;
  walletId?: string;
  walletAccountType?: string;
}

/**
 * Email OTP request response
 */
export interface EmailOtpRequestResponse {
  email: string;
  sid: string;
}

/**
 * Email OTP verification response
 */
export interface EmailOtpVerifyResponse {
  scheme: string;
  accessToken: string;
  accessTokenId: string;
  expireAt: string;
  user: UserData;
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
 * Login state interface for session
 */
export interface LoginState {
  step: LoginStep;
  email?: string;
  sid?: string;
  attemptCount: number;
}