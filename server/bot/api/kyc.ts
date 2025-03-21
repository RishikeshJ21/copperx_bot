import { apiRequest } from './client';
import { 
  KycStatus, 
  KycStatusResponse, 
  PaymentProvider, 
  PaymentRoute,
  KycRequirement
} from '../models/kyc';

/**
 * Get KYC status for a user
 * @param accessToken User's access token
 * @param email User's email address
 * @returns KYC status object
 */
export async function getKycStatus(accessToken: string, email: string) {
  return apiRequest<KycStatusResponse>({
    method: 'GET',
    url: `/api/kycs/status/${email}`,
    accessToken
  });
}

/**
 * Get available payment providers
 * @param accessToken User's access token
 * @returns List of available payment providers
 */
export async function getPaymentProviders(accessToken: string) {
  const response = await apiRequest<{ items: PaymentProvider[] }>({
    method: 'GET',
    url: '/api/kycs/providers',
    accessToken
  });
  
  return response.items || [];
}

/**
 * Get available payment routes
 * @param accessToken User's access token
 * @returns List of available payment routes
 */
export async function getPaymentRoutes(accessToken: string) {
  const response = await apiRequest<{ items: PaymentRoute[] }>({
    method: 'GET',
    url: '/api/kycs/routes',
    accessToken
  });
  
  return response.items || [];
}

/**
 * Submit KYC information (redirects to web platform in practice)
 * @param accessToken User's access token
 * @param kycData KYC submission data
 * @returns Response indicating submission status
 */
export async function submitKycInfo(accessToken: string, kycData: any) {
  return apiRequest<{success: boolean, message: string}>({
    method: 'POST',
    url: '/api/kycs/submit',
    data: kycData,
    accessToken
  });
}

/**
 * Get KYC verification requirements
 * @param accessToken User's access token
 * @returns Verification requirements and steps
 */
export async function getKycRequirements(accessToken: string) {
  const response = await apiRequest<{ items: KycRequirement[] }>({
    method: 'GET',
    url: '/api/kycs/requirements',
    accessToken
  });
  
  return response.items || [];
}