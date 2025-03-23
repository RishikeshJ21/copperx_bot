import { apiRequest } from './client';

/**
 * Interface for total points response
 */
export interface TotalPointsResponse {
  total: number;
}

/**
 * Interface for offramp transfer points item
 */
export interface OfframpTransferPointsItem {
  amountUSD: string;
  noOfTransactions: number;
  multiplier: number;
  perUsdPoint: number;
  points: number;
}

/**
 * Interface for referrer points item
 */
export interface ReferrerPointsItem {
  reference: string;
  totalPoints: number;
  transactionPoints: number;
  referralPoints: number;
  totalTransactions: number;
}

/**
 * Interface for all points response
 */
export interface AllPointsResponse {
  offrampTransferPoints: {
    data: OfframpTransferPointsItem[];
  };
  payoutReferralPoints: {
    data: ReferrerPointsItem[];
  };
}

/**
 * Interface for offramp transfer points response
 */
export interface OfframpTransferPointsResponse {
  data: OfframpTransferPointsItem[];
}

/**
 * Interface for referrer points response
 */
export interface ReferrerPointsResponse {
  data: ReferrerPointsItem[];
}

/**
 * Organization info response
 */
export interface OrganizationResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  supportEmail: string;
  referralCode: string;
  referrerId?: string;
}

/**
 * Apply referral code request
 */
export interface ApplyReferralCodeRequest {
  referralCode: string;
}

/**
 * Apply referral code response
 */
export interface ApplyReferralCodeResponse {
  message: string;
  statusCode: number;
}

/**
 * Get total points for a user
 * @param accessToken User's access token
 * @param email User's email
 * @returns Total points response
 */
export async function getTotalPoints(
  accessToken: string,
  email: string
): Promise<TotalPointsResponse> {
  try {
    return await apiRequest<TotalPointsResponse>({
      method: 'GET',
      url: '/api/points/total',
      params: { email },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get total points:', error);
    throw new Error(`Failed to retrieve total points: ${error.message}`);
  }
}

/**
 * Get all points for a user
 * @param accessToken User's access token
 * @returns All points response
 */
export async function getAllPoints(
  accessToken: string
): Promise<AllPointsResponse> {
  try {
    return await apiRequest<AllPointsResponse>({
      method: 'GET',
      url: '/api/points/all',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get all points:', error);
    throw new Error(`Failed to retrieve all points: ${error.message}`);
  }
}

/**
 * Get offramp transfer points
 * @param accessToken User's access token
 * @returns Offramp transfer points response
 */
export async function getOfframpTransferPoints(
  accessToken: string
): Promise<OfframpTransferPointsResponse> {
  try {
    return await apiRequest<OfframpTransferPointsResponse>({
      method: 'GET',
      url: '/api/points/offramp-transfer-points',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get offramp transfer points:', error);
    throw new Error(`Failed to retrieve offramp transfer points: ${error.message}`);
  }
}

/**
 * Get referrer points
 * @param accessToken User's access token
 * @returns Referrer points response
 */
export async function getReferrerPoints(
  accessToken: string
): Promise<ReferrerPointsResponse> {
  try {
    return await apiRequest<ReferrerPointsResponse>({
      method: 'GET',
      url: '/api/points/referrer-points',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get referrer points:', error);
    throw new Error(`Failed to retrieve referrer points: ${error.message}`);
  }
}

/**
 * Get organization info
 * @param accessToken User's access token
 * @returns Organization response
 */
export async function getOrganizationInfo(
  accessToken: string
): Promise<OrganizationResponse> {
  try {
    return await apiRequest<OrganizationResponse>({
      method: 'GET',
      url: '/api/organization',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get organization info:', error);
    throw new Error(`Failed to retrieve organization info: ${error.message}`);
  }
}

/**
 * Apply a referral code
 * @param accessToken User's access token
 * @param referralCode Referral code to apply
 * @returns Apply referral code response
 */
export async function applyReferralCode(
  accessToken: string,
  referralCode: string
): Promise<ApplyReferralCodeResponse> {
  try {
    return await apiRequest<ApplyReferralCodeResponse>({
      method: 'POST',
      url: '/api/organization/apply-referral-code',
      data: { referralCode },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to apply referral code:', error);
    throw new Error(`Failed to apply referral code: ${error.message}`);
  }
}