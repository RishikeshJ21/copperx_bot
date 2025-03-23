import { apiRequest } from './client';

/**
 * Route interface
 * Represents a payment route for transfers
 */
export interface Route {
  sourceCountry: string;
  sourceCurrency: string;
  sourceMethod: 'web3_wallet' | 'bank';
  destinationCountry: string;
  destinationCurrency: string;
  destinationMethod: 'web3_wallet' | 'bank';
  mode: 'on_ramp' | 'off_ramp';
  providerCode: string;
  status: 'active' | 'inactive';
  kycId?: string;
  kycStatus?: string;
  info?: string;
}

/**
 * Route response interface
 * Response from the routes API
 */
export interface RoutesResponse {
  routes: Route[];
  approvedProviders: string[];
}

/**
 * Get available routes
 * @param accessToken User's access token
 * @returns Available payment routes
 */
export async function getAvailableRoutes(accessToken: string): Promise<RoutesResponse> {
  try {
    return await apiRequest<RoutesResponse>({
      method: 'GET',
      url: '/api/routes',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get available routes:', error);
    throw new Error(`Failed to retrieve available routes: ${error.message}`);
  }
}

/**
 * Provider interface
 * Represents a payment provider
 */
export interface Provider {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  providerCode: string;
  providerData?: {
    kycUrl?: string;
    tosUrl?: string;
    externalStatus?: string;
  };
  externalKycId?: string;
  externalCustomerId?: string;
  supportRemittance?: boolean;
  country?: string;
}

/**
 * Provider response interface
 * Response from the providers API
 */
export interface ProvidersResponse {
  page: number;
  limit: number;
  count: number;
  hasMore: boolean;
  data: Provider[];
}

/**
 * Get available providers
 * @param accessToken User's access token
 * @param page Page number (starts from 1)
 * @param limit Number of items per page
 * @param providerCode Optional provider code to filter by
 * @returns Available payment providers
 */
export async function getProviders(
  accessToken: string,
  page: number = 1,
  limit: number = 10,
  providerCode?: string
): Promise<ProvidersResponse> {
  try {
    const params: any = { page, limit };
    if (providerCode) {
      params.providerCode = providerCode;
    }
    
    return await apiRequest<ProvidersResponse>({
      method: 'GET',
      url: '/api/providers',
      params,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get providers:', error);
    throw new Error(`Failed to retrieve providers: ${error.message}`);
  }
}

/**
 * Create a provider
 * @param accessToken User's access token
 * @param providerCode Provider code to create
 * @param country Country for the provider
 * @returns Created provider
 */
export async function createProvider(
  accessToken: string,
  providerCode: string,
  country: string
): Promise<Provider> {
  try {
    return await apiRequest<Provider>({
      method: 'POST',
      url: '/api/providers',
      data: { providerCode, country },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to create provider:', error);
    throw new Error(`Failed to create provider: ${error.message}`);
  }
}

/**
 * Get bridge TOS link
 * @param accessToken User's access token
 * @returns TOS link
 */
export async function getBridgeTosLink(accessToken: string): Promise<string> {
  try {
    return await apiRequest<string>({
      method: 'POST',
      url: '/api/providers/bridge-tos-link',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get bridge TOS link:', error);
    throw new Error(`Failed to retrieve bridge TOS link: ${error.message}`);
  }
}