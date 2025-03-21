import { apiRequest } from './client';
import { EmailOtpRequestResponse, EmailOtpVerifyResponse, UserData } from '../models/auth';

/**
 * Request email OTP for login
 * @param email User's email address
 * @returns Response containing email and session ID
 */
export async function requestEmailOTP(email: string): Promise<EmailOtpRequestResponse> {
  try {
    return await apiRequest<EmailOtpRequestResponse>({
      method: 'POST',
      url: '/api/auth/email-otp/request',
      data: { email },
    });
  } catch (error: any) {
    console.error('Failed to request email OTP:', error);
    throw new Error(`Failed to send verification code: ${error.message}`);
  }
}

/**
 * Verify OTP and authenticate user
 * @param email User's email address
 * @param otp OTP code received via email
 * @param sid Session ID from OTP request
 * @returns Authentication response with access token
 */
export async function verifyEmailOTP(
  email: string,
  otp: string,
  sid: string
): Promise<EmailOtpVerifyResponse> {
  try {
    return await apiRequest<EmailOtpVerifyResponse>({
      method: 'POST',
      url: '/api/auth/email-otp/authenticate',
      data: { email, otp, sid },
    });
  } catch (error: any) {
    console.error('Failed to verify email OTP:', error);
    throw new Error(`Failed to verify code: ${error.message}`);
  }
}

/**
 * Get current user profile
 * @param accessToken User's access token
 * @returns User profile data
 */
export async function getUserProfile(accessToken: string): Promise<UserData> {
  try {
    return await apiRequest<UserData>({
      method: 'GET',
      url: '/api/auth/me',
      accessToken,
    });
  } catch (error: any) {
    console.error('Failed to get user profile:', error);
    throw new Error(`Failed to retrieve profile: ${error.message}`);
  }
}

/**
 * Log out user (invalidate token)
 * @param accessToken User's access token
 * @returns Success status
 */
export async function logout(accessToken: string): Promise<boolean> {
  try {
    await apiRequest<{ message: string, statusCode: number }>({
      method: 'POST',
      url: '/api/auth/logout',
      accessToken,
    });
    return true;
  } catch (error: any) {
    console.error('Failed to logout:', error);
    return false;
  }
}

/**
 * Update user flags (e.g., for onboarding)
 * @param accessToken User's access token
 * @param flag Flag to set (e.g., 'intro')
 * @returns Updated user data
 */
export async function updateUserFlag(accessToken: string, flag: string): Promise<UserData> {
  try {
    return await apiRequest<UserData>({
      method: 'PUT',
      url: '/api/auth/flags',
      data: { flag },
      accessToken,
    });
  } catch (error: any) {
    console.error('Failed to update user flag:', error);
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
}