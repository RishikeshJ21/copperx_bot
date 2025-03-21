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
  try {
    return await apiRequest<KycStatusResponse>({
      method: 'GET',
      url: `/api/kycs/status`,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get KYC status:', error);
    throw new Error(`Failed to retrieve KYC status: ${error.message}`);
  }
}

/**
 * Get available payment providers
 * @param accessToken User's access token
 * @returns List of available payment providers
 */
export async function getPaymentProviders(accessToken: string) {
  try {
    const response = await apiRequest<{ items: PaymentProvider[] }>({
      method: 'GET',
      url: '/api/kycs/providers',
      accessToken
    });
    
    return response.items || [];
  } catch (error: any) {
    console.error('Failed to get payment providers:', error);
    throw new Error(`Failed to retrieve payment providers: ${error.message}`);
  }
}

/**
 * Get available payment routes
 * @param accessToken User's access token
 * @returns List of available payment routes
 */
export async function getPaymentRoutes(accessToken: string) {
  try {
    const response = await apiRequest<{ items: PaymentRoute[] }>({
      method: 'GET',
      url: '/api/kycs/routes',
      accessToken
    });
    
    return response.items || [];
  } catch (error: any) {
    console.error('Failed to get payment routes:', error);
    throw new Error(`Failed to retrieve payment routes: ${error.message}`);
  }
}

/**
 * Submit KYC information (redirects to web platform in practice)
 * @param accessToken User's access token
 * @param kycData KYC submission data
 * @returns Response indicating submission status
 */
export async function submitKycInfo(accessToken: string, kycData: any) {
  try {
    return await apiRequest<{success: boolean, message: string}>({
      method: 'POST',
      url: '/api/kycs/submit',
      data: kycData,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to submit KYC information:', error);
    throw new Error(`Failed to submit KYC information: ${error.message}`);
  }
}

/**
 * Get KYC verification requirements
 * @param accessToken User's access token
 * @returns Verification requirements and steps
 */
export async function getKycRequirements(accessToken: string) {
  try {
    const response = await apiRequest<{ items: KycRequirement[] }>({
      method: 'GET',
      url: '/api/kycs/requirements',
      accessToken
    });
    
    return response.items || [];
  } catch (error: any) {
    console.error('Failed to get KYC requirements:', error);
    throw new Error(`Failed to retrieve KYC requirements: ${error.message}`);
  }
}