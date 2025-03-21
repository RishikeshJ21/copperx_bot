/**
 * KYC status interface
 * Represents a user's KYC verification status
 */
export interface KycStatus {
  status: KycStatusType;
  level?: number | string;
  provider?: string;
  verificationDate?: string;
  expiryDate?: string;
  limits?: KycLimits;
  availableServices?: string[];
  rejectionReason?: string;
  nextSteps?: string[];
}

/**
 * KYC status type enum
 * Possible verification statuses
 */
export enum KycStatusType {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

/**
 * KYC limits interface
 * Transaction limits based on KYC level
 */
export interface KycLimits {
  daily?: number;
  monthly?: number;
  annual?: number;
  perTransaction?: number;
}

/**
 * Payment provider interface
 * Information about a KYC/payment provider
 */
export interface PaymentProvider {
  id: string;
  name: string;
  description?: string;
  supportedCountries?: string[];
  supportedDocumentTypes?: string[];
  isActive: boolean;
}

/**
 * Payment route interface
 * Available payment method based on KYC status
 */
export interface PaymentRoute {
  id: string;
  name: string;
  type: string;
  minAmount?: string;
  maxAmount?: string;
  fee?: string;
  processingTime?: string;
  requiredKycLevel?: number | string;
  isActive: boolean;
}

/**
 * KYC requirement interface
 * Required documents/information for KYC verification
 */
export interface KycRequirement {
  level: number | string;
  name: string;
  description: string;
  requiredDocuments: KycDocument[];
  additionalInfo?: string[];
}

/**
 * KYC document interface
 * Document type required for KYC
 */
export interface KycDocument {
  type: string;
  name: string;
  description?: string;
  acceptedFormats?: string[];
  isRequired: boolean;
}

/**
 * KYC status response interface
 * API response for KYC status requests
 */
export interface KycStatusResponse {
  userEmail: string;
  status: KycStatusType;
  level?: string | number;
  verificationDate?: string;
  expiryDate?: string;
  provider?: string;
  limits?: KycLimits;
  availableServices?: string[];
  message?: string;
  rejectionReason?: string;
  nextSteps?: string[];
}

/**
 * KYC submission interface
 * Data for KYC submission
 */
export interface KycSubmission {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
  documentCountry: string;
  documentFiles?: string[]; // Base64 encoded or file references
}