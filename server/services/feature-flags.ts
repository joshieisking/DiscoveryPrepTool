/**
 * Feature flags configuration for gradual rollout and safe deployment
 */
export const FEATURES = {
  PARALLEL_PROCESSING: process.env.ENABLE_PARALLEL_PROCESSING === 'true'
};

export const getFeatureFlag = (flag: keyof typeof FEATURES): boolean => {
  return FEATURES[flag] || false;
};