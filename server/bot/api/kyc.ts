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
    console.log(`Getting KYC status for email: ${email}`);
    
    // First try the new endpoint
    try {
      const response = await apiRequest<any>({
        method: 'GET',
        url: `/api/kycs/status/${encodeURIComponent(email)}`,
        accessToken
      });
      
      console.log('KYC status response from /api/kycs/status:', response);
      
      // The response may be a string status or an object
      if (typeof response === 'string') {
        return {
          userEmail: email,
          status: response,
          message: `KYC status: ${response}`,
          nextSteps: response === 'verified' 
            ? [] 
            : ['Complete KYC verification to unlock all features']
        };
      } else if (response && typeof response === 'object') {
        return response;
      }
    } catch (apiError: any) {
      console.log('Error from primary KYC endpoint, trying fallback:', apiError.message);
      // If first endpoint fails, try the fallback endpoint
    }
    
    // Fallback to alternate KYC endpoint
    const kycInfo = await apiRequest<any>({
      method: 'GET',
      url: '/api/kycs',
      params: { 
        limit: 1,
        page: 1
      },
      accessToken
    });
    
    console.log('KYC info from fallback endpoint:', JSON.stringify(kycInfo));
    
    if (kycInfo && kycInfo.data && kycInfo.data.length > 0) {
      const latestKyc = kycInfo.data[0];
      return {
        userEmail: email,
        status: latestKyc.status,
        level: '1',
        verificationDate: latestKyc.updatedAt,
        provider: latestKyc.kycProviderCode,
        message: `KYC status: ${latestKyc.status}`,
        nextSteps: latestKyc.status === 'verified' 
          ? [] 
          : ['Complete KYC verification to unlock all features']
      };
    }
    
    // If we get here, no KYC info was found, return default not_started status
    return {
      userEmail: email,
      status: 'not_started',
      message: 'KYC verification not started',
      nextSteps: ['Complete KYC verification process to unlock all features']
    };
  } catch (error: any) {
    console.error('Failed to get KYC status:', error);
    
    // Check if this is a 404 (not found) error
    if (error.status === 404 || (error.response && error.response.status === 404)) {
      return {
        userEmail: email,
        status: 'not_started',
        message: 'KYC verification not started',
        nextSteps: ['Complete KYC verification to unlock all features']
      };
    }
    
    throw {
      message: `Failed to retrieve KYC status: ${error.message}`,
      status: error.status || 500
    };
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
      url: '/api/kyc/providers',
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
      url: '/api/kyc/payment-routes',
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
      url: '/api/kyc/verify',
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
      url: '/api/kyc/requirements',
      accessToken
    });
    
    return response.items || [];
  } catch (error: any) {
    console.error('Failed to get KYC requirements:', error);
    throw new Error(`Failed to retrieve KYC requirements: ${error.message}`);
  }
}