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
    
    // First try the official documented endpoint
    try {
      const response = await apiRequest<KycStatusResponse>({
        method: 'GET',
        url: `/api/kycs/status/${encodeURIComponent(email)}`,
        accessToken
      });
      
      console.log('KYC status response from /api/kycs/status:', response);
      
      // Return appropriately formatted response
      return response;
    } catch (apiError: any) {
      console.log('Error from primary KYC endpoint, trying fallback:', apiError.message);
      // If first endpoint fails, try the fallback endpoint
    }
    
    // Fallback to KYCs list endpoint
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
        level: latestKyc.level || '1',
        verificationDate: latestKyc.updatedAt,
        provider: latestKyc.kycProviderCode || latestKyc.providerCode,
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
 * Get all KYCs
 * @param accessToken User's access token
 * @param page Page number
 * @param limit Items per page
 * @returns List of KYC records
 */
export async function getAllKycs(accessToken: string, page: number = 1, limit: number = 10) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: '/api/kycs',
      params: { page, limit },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get KYCs:', error);
    throw new Error(`Failed to retrieve KYCs: ${error.message}`);
  }
}

/**
 * Get KYC by ID
 * @param accessToken User's access token
 * @param id KYC ID
 * @returns KYC details
 */
export async function getKycById(accessToken: string, id: string) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: `/api/kycs/${id}`,
      accessToken
    });
  } catch (error: any) {
    console.error(`Failed to get KYC ${id}:`, error);
    throw new Error(`Failed to retrieve KYC details: ${error.message}`);
  }
}

/**
 * Create new KYC
 * @param accessToken User's access token
 * @param kycData KYC data
 * @returns Created KYC
 */
export async function createKyc(accessToken: string, kycData: any) {
  try {
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/kycs',
      data: kycData,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to create KYC:', error);
    throw new Error(`Failed to create KYC: ${error.message}`);
  }
}

/**
 * Update KYC by ID
 * @param accessToken User's access token
 * @param id KYC ID
 * @param kycData KYC data to update
 * @returns Updated KYC
 */
export async function updateKyc(accessToken: string, id: string, kycData: any) {
  try {
    return await apiRequest<any>({
      method: 'PUT',
      url: `/api/kycs/${id}`,
      data: kycData,
      accessToken
    });
  } catch (error: any) {
    console.error(`Failed to update KYC ${id}:`, error);
    throw new Error(`Failed to update KYC: ${error.message}`);
  }
}

/**
 * Get KYC public details
 * @param signature Public signature
 * @returns Public KYC details
 */
export async function getKycPublicDetails(signature: string) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: `/api/kycs/public/${signature}/detail`
    });
  } catch (error: any) {
    console.error('Failed to get KYC public details:', error);
    throw new Error(`Failed to retrieve KYC public details: ${error.message}`);
  }
}

/**
 * Get KYC URL
 * @param signature Public signature
 * @returns KYC URL
 */
export async function getKycUrl(signature: string) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: `/api/kycs/public/${signature}/kyc-url`
    });
  } catch (error: any) {
    console.error('Failed to get KYC URL:', error);
    throw new Error(`Failed to retrieve KYC URL: ${error.message}`);
  }
}

/**
 * Get states by country code
 * @param accessToken User's access token
 * @param countryCode ISO country code
 * @returns List of states
 */
export async function getStatesByCountry(accessToken: string, countryCode: string) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: `/api/kycs/states/${countryCode}`,
      accessToken
    });
  } catch (error: any) {
    console.error(`Failed to get states for country ${countryCode}:`, error);
    throw new Error(`Failed to retrieve states: ${error.message}`);
  }
}

/**
 * Get available payment providers
 * @param accessToken User's access token
 * @returns List of available payment providers
 */
export async function getProviders(accessToken: string, page: number = 1, limit: number = 20) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: '/api/providers',
      params: { page, limit },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get payment providers:', error);
    throw new Error(`Failed to retrieve payment providers: ${error.message}`);
  }
}

/**
 * Create payment provider
 * @param accessToken User's access token
 * @param providerData Provider data
 * @returns Created provider
 */
export async function createProvider(accessToken: string, providerData: any) {
  try {
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/providers',
      data: providerData,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to create provider:', error);
    throw new Error(`Failed to create provider: ${error.message}`);
  }
}

/**
 * Get provider by ID
 * @param accessToken User's access token
 * @param id Provider ID
 * @returns Provider details
 */
export async function getProviderById(accessToken: string, id: string) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: `/api/providers/${id}`,
      accessToken
    });
  } catch (error: any) {
    console.error(`Failed to get provider ${id}:`, error);
    throw new Error(`Failed to retrieve provider details: ${error.message}`);
  }
}

/**
 * Get bridge TOS link
 * @param accessToken User's access token
 * @returns Bridge TOS link
 */
export async function getBridgeTosLink(accessToken: string) {
  try {
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/providers/bridge-tos-link',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get bridge TOS link:', error);
    throw new Error(`Failed to retrieve bridge TOS link: ${error.message}`);
  }
}

/**
 * Submit KYC on partner
 * @param accessToken User's access token
 * @param submitData Submission data
 * @returns Submission result
 */
export async function submitKycOnPartner(accessToken: string, submitData: any) {
  try {
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/providers/submit-kyc-on-partner',
      data: submitData,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to submit KYC on partner:', error);
    throw new Error(`Failed to submit KYC on partner: ${error.message}`);
  }
}

/**
 * Get available routes
 * @param accessToken User's access token
 * @returns Available payment routes
 */
export async function getAvailableRoutes(accessToken: string) {
  try {
    return await apiRequest<any>({
      method: 'GET',
      url: '/api/routes',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get available routes:', error);
    throw new Error(`Failed to retrieve available routes: ${error.message}`);
  }
}