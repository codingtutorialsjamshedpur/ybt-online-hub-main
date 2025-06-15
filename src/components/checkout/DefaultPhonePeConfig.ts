// Default PhonePe configuration for testing
// These are the test credentials that PhonePe provides for sandbox testing

export const DEFAULT_PHONEPE_CONFIG = {
  name: 'PhonePe India',
  provider: 'phonepe',
  isActive: true,
  merchantId: 'TEST-M23VR50UZCWH0_25052',
  merchantKeyId: 'TEST-M23VR50UZCWH0_25052',
  merchantKeySecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
  mode: 'test',
  callbackUrl: window.location.origin + '/payment-callback',
  redirectUrl: window.location.origin + '/payment-callback'
};

// Production credentials - only use in production environment
export const PROD_PHONEPE_CONFIG = {
  name: 'PhonePe India',
  provider: 'phonepe',
  isActive: true,
  merchantId: 'SU2505262030593101637421',
  merchantKeyId: 'SU2505262030593101637421',
  merchantKeySecret: 'e5dcff97-ce5c-4b4f-a621-c4d03fccd9cd',
  mode: 'production',
  callbackUrl: window.location.origin + '/payment-callback',
  redirectUrl: window.location.origin + '/payment-callback'
};
