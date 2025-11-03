/**
 * Expo Push Notifications Configuration - Expert Level
 *
 * Senior React Native Developer (10+ years experience)
 * Production-ready notification setup with:
 * - Comprehensive Expo configuration
 * - Advanced permission handling
 * - Cross-platform notification management
 * - Error handling & validation
 * - Background notification support
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Notification Configuration Interface
 */
interface NotificationConfig {
  expoProjectId: string;
  accessToken: string;
  apiKey?: string;
  channels: NotificationChannel[];
  permissions: NotificationPermissions;
  behaviors: NotificationBehaviors;
}

interface NotificationChannel {
  id: string;
  name: string;
  importance: Notifications.AndroidImportance;
  sound?: string;
  vibrationPattern?: number[];
  enableLights?: boolean;
  lightColor?: string;
  enableVibrate?: boolean;
}

interface NotificationPermissions {
  alert: boolean;
  badge: boolean;
  sound: boolean;
  criticalAlert?: boolean;
  provisional?: boolean;
}

interface NotificationBehaviors {
  showInForeground: boolean;
  playSound: boolean;
  priority: Notifications.AndroidNotificationPriority;
  vibrate: boolean;
}

/**
 * Production Notification Configuration
 * Using your actual Expo project credentials from research.md
 */
const PRODUCTION_CONFIG: NotificationConfig = {
  expoProjectId: "6f3f2f9e-ed44-4558-8eb0-eb757b5072ba",
  accessToken: "yE2iNndMmZZUHIigFBstdX7EmskG3Zy285KpZrHY",
  channels: [
    {
      id: 'bus-alarms',
      name: 'Bus Arrival Alarms',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250],
      enableLights: true,
      lightColor: '#FF9800'
    },
    {
      id: 'bus-updates',
      name: 'Bus Status Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      enableVibrate: false
    },
    {
      id: 'search-suggestions',
      name: 'Search Suggestions',
      importance: Notifications.AndroidImportance.LOW,
      sound: undefined,
      enableVibrate: false
    }
  ],
  permissions: {
    alert: true,
    badge: true,
    sound: true,
    criticalAlert: false,
    provisional: false
  },
  behaviors: {
    showInForeground: true,
    playSound: true,
    priority: Notifications.AndroidNotificationPriority.DEFAULT,
    vibrate: true
  }
};

/**
 * Development Notification Configuration
 */
const DEVELOPMENT_CONFIG: NotificationConfig = {
  ...PRODUCTION_CONFIG,
  // Override any development-specific settings here
};

/**
 * Get notification configuration based on environment
 */
const getNotificationConfig = (): NotificationConfig => {
  return __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
};

/**
 * Notification handler configuration
 */
export const configureNotificationHandlers = (): void => {
  // Set notification handler for when notifications are received while app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const config = getNotificationConfig();

      return {
        shouldShowAlert: config.permissions.alert,
        shouldPlaySound: config.permissions.sound,
        shouldSetBadge: config.permissions.badge,
      };
    },
  });

  console.log('🔔 Notification handlers configured');
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // Android permissions
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('bus-alarms', {
        name: 'Bus Arrival Alarms',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        enableVibrate: true,
        vibrationPattern: [0, 250],
        enableLights: true,
        lightColor: '#FF9800',
      });

      await Notifications.setNotificationChannelAsync('bus-updates', {
        name: 'Bus Status Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        enableVibrate: false,
      });

      await Notifications.setNotificationChannelAsync('search-suggestions', {
        name: 'Search Suggestions',
        importance: Notifications.AndroidImportance.LOW,
        sound: undefined,
        enableVibrate: false,
      });
    }

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();

    console.log('🔔 Notification permission status:', status);

    if (status === 'granted') {
      console.log('✅ Notification permissions granted');
      return true;
    } else {
      console.warn('⚠️ Notification permissions denied');
      return false;
    }

  } catch (error) {
    console.error('❌ Failed to request notification permissions:', error);
    return false;
  }
};

/**
 * Get Expo push token
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    const config = getNotificationConfig();

    if (!config.expoProjectId) {
      console.error('❌ Expo project ID not configured');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: config.expoProjectId,
    });

    console.log('🔔 Expo push token obtained');
    return token.data;

  } catch (error) {
    console.error('❌ Failed to get Expo push token:', error);
    return null;
  }
};

/**
 * Schedule a bus arrival notification
 */
export const scheduleBusAlarm = async (
  stoppageName: string,
  arrivalTime: Date,
  busName: string,
  minutesBefore: number = 10
): Promise<string | null> => {
  try {
    // Calculate trigger time
    const triggerTime = new Date(arrivalTime.getTime() - (minutesBefore * 60 * 1000));

      // Don't schedule if time is in the past
    if (triggerTime.getTime() <= new Date().getTime()) {
      console.warn('⚠️ Cannot schedule alarm for past time');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚌 Bus Arrival Alert`,
        body: `Your bus "${busName}" will arrive at ${stoppageName} in ${minutesBefore} minutes!`,
        data: {
          type: 'bus-alarm',
          stoppageName,
          arrivalTime: arrivalTime.toISOString(),
          busName,
          minutesBefore
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: triggerTime,
      },
    });

    console.log(`🔔 Bus alarm scheduled: ${stoppageName} at ${arrivalTime.toISOString()}`);
    return notificationId;

  } catch (error) {
    console.error('❌ Failed to schedule bus alarm:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('🔔 Notification cancelled:', notificationId);
  } catch (error) {
    console.error('❌ Failed to cancel notification:', error);
  }
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🔔 All notifications cancelled');
  } catch (error) {
    console.error('❌ Failed to cancel all notifications:', error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`🔔 Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Failed to get scheduled notifications:', error);
    return [];
  }
};

/**
 * Show an immediate notification
 */
export const showImmediateNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<string | null> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Show immediately
    });

    console.log('🔔 Immediate notification shown:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('❌ Failed to show immediate notification:', error);
    return null;
  }
};

/**
 * Background notification setup
 */
export const setupBackgroundNotifications = (): void => {
  // Handle notifications received when app is in background
  Notifications.addNotificationResponseReceivedListener(response => {
    const { notification } = response;
    const data = notification.request.content.data;

    console.log('🔔 Background notification received:', data);

    // Handle different notification types
    if (data.type === 'bus-alarm') {
      console.log('🚌 Bus alarm triggered:', data.stoppageName);
      // Navigate to bus details or show alert modal
    }
  });

  console.log('🔔 Background notifications setup complete');
};

/**
 * Notification types and constants
 */
export const NOTIFICATION_TYPES = {
  BUS_ALARM: 'bus-alarm',
  BUS_UPDATE: 'bus-update',
  SEARCH_SUGGESTION: 'search-suggestion',
  SYSTEM_NOTIFICATION: 'system-notification'
} as const;

/**
 * Default notification sounds
 */
export const NOTIFICATION_SOUNDS = {
  DEFAULT: 'default',
  GENTLE: 'gentle',
  URGENT: 'urgent',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

/**
 * Initialize notifications on app start
 */
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    // Configure handlers
    configureNotificationHandlers();

    // Setup background handling
    setupBackgroundNotifications();

    // Request permissions
    const hasPermissions = await requestNotificationPermissions();

    if (hasPermissions) {
      // Get push token
      const token = await getExpoPushToken();
      if (token) {
        console.log('🔔 Notifications initialized successfully');
        return true;
      }
    }

    console.warn('⚠️ Notifications initialization incomplete');
    return false;

  } catch (error) {
    console.error('❌ Failed to initialize notifications:', error);
    return false;
  }
};

/**
 * Export configuration and utilities
 */
export const notificationConfig = getNotificationConfig();

export default {
  configureNotificationHandlers,
  requestNotificationPermissions,
  getExpoPushToken,
  scheduleBusAlarm,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  showImmediateNotification,
  setupBackgroundNotifications,
  initializeNotifications,
  NOTIFICATION_TYPES,
  NOTIFICATION_SOUNDS,
  notificationConfig
};