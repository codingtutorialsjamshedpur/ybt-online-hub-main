/**
 * Default PhonePe payment gateway configuration
 * This is used as a fallback when no active gateway is found in Firestore
 */

export type PhonePeEnvironment = 'test' | 'production';

export interface PhonePeConfig {
  clientId: string;
  clientSecret: string;
  merchantId: string;
  mode: PhonePeEnvironment;
  isProduction: boolean;
}

// Test credentials
export const DEFAULT_TEST_CONFIG: PhonePeConfig = {
  clientId: 'TEST-M23VR50UZCWH0_25052',
  clientSecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
  merchantId: 'TEST-M23VR50UZCWH0_25052',
  mode: 'test',
  isProduction: false
};

// Production credentials
export const DEFAULT_PROD_CONFIG: PhonePeConfig = {
  clientId: 'SU2505262030593101637421',
  clientSecret: 'e5dcff97-ce5c-4b4f-a621-c4d03fccd9cd',
  merchantId: 'SU2505262030593101637421',
  mode: 'production',
  isProduction: true
};

// Use this function to get default config based on environment
export const getDefaultPhonePeConfig = (isProduction: boolean = false): PhonePeConfig => {
  return isProduction ? DEFAULT_PROD_CONFIG : DEFAULT_TEST_CONFIG;
};
