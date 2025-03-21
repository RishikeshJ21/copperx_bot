import { apiRequest } from './client';
import { EmailOtpRequestResponse, EmailOtpVerifyResponse, UserData } from '../models/auth';

/**
 * Request email OTP for login
 * @param email User's email address
 * @returns Response containing email and session ID
 */
export async function requestEmailOTP(email: string): Promise<EmailOtpRequestResponse> {
  return apiRequest<EmailOtpRequestResponse>({
    method: 'POST',
    url: '/api/auth/email/request-otp',
    data: { email }
  });
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
  return apiRequest<EmailOtpVerifyResponse>({
    method: 'POST',
    url: '/api/auth/email/verify-otp',
    data: { email, otp, sid }
  });
}

/**
 * Get current user profile
 * @param accessToken User's access token
 * @returns User profile data
 */
export async function getUserProfile(accessToken: string): Promise<UserData> {
  return apiRequest<UserData>({
    method: 'GET',
    url: '/api/users/me',
    accessToken
  });
}

/**
 * Log out user (invalidate token)
 * @param accessToken User's access token
 * @returns Success status
 */
export async function logout(accessToken: string): Promise<boolean> {
  return apiRequest<boolean>({
    method: 'POST',
    url: '/api/auth/logout',
    accessToken
  });
}

/**
 * Update user flags (e.g., for onboarding)
 * @param accessToken User's access token
 * @param flag Flag to set (e.g., 'intro')
 * @returns Updated user data
 */
export async function updateUserFlag(accessToken: string, flag: string): Promise<UserData> {
  return apiRequest<UserData>({
    method: 'PATCH',
    url: '/api/users/me/flags',
    data: { flag },
    accessToken
  });
}