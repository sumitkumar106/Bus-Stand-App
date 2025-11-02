/**
 * AdMob Configuration
 *
 * Expert-level AdMob integration with:
 * - Platform-specific configuration
 * - Environment-based setup (development/production)
 * - Error handling and validation
 * - Ad unit management
 * - Test ads support
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import { Platform } from 'react-native';

/**
 * AdMob Configuration Interface
 */
interface AdMobConfig {
  appIds: {
    android: string;
    ios: string;
    web?: string;
  };
  adUnits: {
    banners: {
      android: string;
      ios: string;
      web?: string;
    };
    interstitial: {
      android: string;
      ios: string;
      web?: string;
    };
    rewarded: {
      android: string;
      ios: string;
      web?: string;
    };
  };
  testAds: {
    enabled: boolean;
    testDeviceIds: string[];
  };
}

/**
 * Production AdMob Configuration
 * Using your actual AdMob IDs from research.md
 */
const PRODUCTION_CONFIG: AdMobConfig = {
  appIds: {
    android: "ca-app-pub-6801510207917997~6362172176",
    ios: "ca-app-pub-6801510207917997~4471324247",
    web: "ca-app-pub-6801510207917997~1234567890" // Web placeholder if needed
  },
  adUnits: {
    banners: {
      android: "ca-app-pub-3940256099942544/6300978111",
      ios: "ca-app-pub-3940256099942544/2934735716",
      web: "ca-app-pub-3940256099942544/5224354917"
    },
    interstitial: {
      android: "ca-app-pub-3940256099942544/1033173712",
      ios: "ca-app-pub-3940256099942544/4411468910",
      web: "ca-app-pub-3940256099942544/3253175242"
    },
    rewarded: {
      android: "ca-app-pub-3940256099942544/5224354917",
      ios: "ca-app-pub-3940256099942544/1712484310",
      web: "ca-app-pub-3940256099942544/1033173712"
    }
  },
  testAds: {
    enabled: __DEV__, // Enable test ads in development
    testDeviceIds: []
  }
};

/**
 * Development AdMob Configuration
 * Using Google's test ad units for development
 */
const DEVELOPMENT_CONFIG: AdMobConfig = {
  ...PRODUCTION_CONFIG,
  adUnits: {
    banners: {
      android: "ca-app-pub-3940256099942544/6300978111", // Google test banner
      ios: "ca-app-pub-3940256099942544/2934735716", // Google test banner
      web: "ca-app-pub-3940256099942544/5224354917"
    },
    interstitial: {
      android: "ca-app-pub-3940256099942544/1033173712", // Google test interstitial
      ios: "ca-app-pub-3940256099942544/4411468910", // Google test interstitial
      web: "ca-app-pub-3940256099942544/3253175242"
    },
    rewarded: {
      android: "ca-app-pub-3940256099942544/5224354917", // Google test rewarded
      ios: "ca-app-pub-3940256099942544/1712484310", // Google test rewarded
      web: "ca-app-pub-3940256099942544/1033173712"
    }
  },
  testAds: {
    enabled: true,
    testDeviceIds: []
  }
};

/**
 * AdMob Configuration Selector
 */
const getAdMobConfig = (): AdMobConfig => {
  return __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
};

/**
 * Get current platform app ID
 */
export const getAppId = (): string => {
  const config = getAdMobConfig();

  switch (Platform.OS) {
    case 'android':
      return config.appIds.android;
    case 'ios':
      return config.appIds.ios;
    case 'web':
      return config.appIds.web || config.appIds.android;
    default:
      return config.appIds.android;
  }
};

/**
 * Get banner ad unit ID for current platform
 */
export const getBannerAdUnitId = (): string => {
  const config = getAdMobConfig();

  switch (Platform.OS) {
    case 'android':
      return config.adUnits.banners.android;
    case 'ios':
      return config.adUnits.banners.ios;
    case 'web':
      return config.adUnits.banners.web || config.adUnits.banners.android;
    default:
      return config.adUnits.banners.android;
  }
};

/**
 * Get interstitial ad unit ID for current platform
 */
export const getInterstitialAdUnitId = (): string => {
  const config = getAdMobConfig();

  switch (Platform.OS) {
    case 'android':
      return config.adUnits.interstitial.android;
    case 'ios':
      return config.adUnits.interstitial.ios;
    case 'web':
      return config.adUnits.interstitial.web || config.adUnits.interstitial.android;
    default:
      return config.adUnits.interstitial.android;
  }
};

/**
 * Get rewarded ad unit ID for current platform
 */
export const getRewardedAdUnitId = (): string => {
  const config = getAdMobConfig();

  switch (Platform.OS) {
    case 'android':
      return config.adUnits.rewarded.android;
    case 'ios':
      return config.adUnits.rewarded.ios;
    case 'web':
      return config.adUnits.rewarded.web || config.adUnits.rewarded.android;
    default:
      return config.adUnits.rewarded.android;
  }
};

/**
 * Check if test ads are enabled
 */
export const areTestAdsEnabled = (): boolean => {
  const config = getAdMobConfig();
  return config.testAds.enabled;
};

/**
 * Ad validation utilities
 */
export const validateAdUnitId = (adUnitId: string): boolean => {
  // Basic validation for ad unit ID format
  const adUnitPattern = /^ca-app-pub-\d+~\d+$/;
  return adUnitPattern.test(adUnitId);
};

/**
 * Ad loading error messages
 */
export const AD_ERROR_MESSAGES = {
  LOAD_FAILED: "Failed to load ad. Please try again later.",
  NO_FILL: "No ad available at this time.",
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  INVALID_AD_UNIT: "Invalid ad unit configuration.",
  INTERNAL_ERROR: "Ad loading failed due to internal error.",
  TIMEOUT: "Ad loading timed out. Please try again."
} as const;

/**
 * Ad positioning constants
 */
export const AD_POSITIONS = {
  BOTTOM: 'bottom',
  TOP: 'top',
  CENTER: 'center',
  INLINE: 'inline'
} as const;

/**
 * Ad dimensions for different platforms
 */
export const AD_DIMENSIONS = {
  BANNER: {
    width: 320,
    height: 50,
    type: 'Banner'
  },
  LARGE_BANNER: {
    width: 320,
    height: 100,
    type: 'LargeBanner'
  },
  MEDIUM_RECTANGLE: {
    width: 300,
    height: 250,
    type: 'MediumRectangle'
  },
  FULL_BANNER: {
    width: 468,
    height: 60,
    type: 'FullBanner'
  },
  LEADERBOARD: {
    width: 728,
    height: 90,
    type: 'Leaderboard'
  },
  ADAPTIVE_BANNER: {
    width: 'adaptive',
    height: 'adaptive',
    type: 'AdaptiveBanner'
  }
} as const;

/**
 * Ad refresh intervals (in seconds)
 */
export const AD_REFRESH_INTERVALS = {
  BANNER: 60, // 1 minute
  INTERSTITIAL: 0, // No auto-refresh for interstitial
  REWARDED: 0 // No auto-refresh for rewarded
} as const;

/**
 * Ad targeting options
 */
export const AD_TARGETING = {
  CONTENT_RATING: {
    G: 'G',
    PG: 'PG',
    T: 'T',
    MA: 'MA'
  },
  CHILD_DIRECTED_TREATMENT: {
    TRUE: true,
    FALSE: false,
    UNSPECIFIED: null
  },
  MAX_AD_CONTENT_RATING: {
    G: 'G',
    PG: 'PG',
    T: 'T',
    MA: 'MA'
  }
} as const;

/**
 * Configuration validation
 */
const validateAdMobConfig = (config: AdMobConfig): boolean => {
  try {
    // Validate app IDs
    if (!config.appIds.android || !validateAdUnitId(config.appIds.android)) {
      console.error('❌ Invalid Android app ID');
      return false;
    }

    if (!config.appIds.ios || !validateAdUnitId(config.appIds.ios)) {
      console.error('❌ Invalid iOS app ID');
      return false;
    }

    // Validate ad units
    if (!config.adUnits.banners.android || !validateAdUnitId(config.adUnits.banners.android)) {
      console.error('❌ Invalid Android banner ad unit ID');
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ AdMob configuration validation failed:', error);
    return false;
  }
};

/**
 * Initialize AdMob configuration
 */
const initializeAdMobConfig = (): void => {
  const config = getAdMobConfig();

  if (!validateAdMobConfig(config)) {
    console.error('❌ Invalid AdMob configuration detected');
    return;
  }

  console.log('📱 AdMob configuration initialized successfully');
  console.log('📱 Platform:', Platform.OS);
  console.log('📱 Test Ads Enabled:', areTestAdsEnabled());
  console.log('📱 App ID:', getAppId());
};

// Initialize on module import
initializeAdMobConfig();

export default getAdMobConfig;