/**
 * Notification Service
 *
 * Expert-level notification service with:
 * - Push notification management
 * - Local notifications
 * - Scheduled notifications
 * - Notification preferences
 * - Background notifications
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import {
  initializeNotifications,
  scheduleBusAlarm,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  showImmediateNotification,
  NOTIFICATION_TYPES,
  NOTIFICATION_SOUNDS
} from '../config/notificationConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notification Preference Interface
 */
interface NotificationPreferences {
  busAlarms: boolean;
  busUpdates: boolean;
  searchSuggestions: boolean;
  promotional: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  defaultAlarmMinutes: number;
}

/**
 * Scheduled Notification Interface
 */
interface ScheduledNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: any;
  isActive: boolean;
}

/**
 * Notification Service Class
 */
class NotificationService {
  private static readonly STORAGE_KEYS = {
    NOTIFICATION_PREFERENCES: 'notification_preferences',
    SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
    NOTIFICATION_HISTORY: 'notification_history'
  };

  private preferences: NotificationPreferences = {
    busAlarms: true,
    busUpdates: true,
    searchSuggestions: false,
    promotional: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00'
    },
    defaultAlarmMinutes: 15
  };

  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize notification service
   */
  public async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      // Initialize notifications from config
      const initResult = await initializeNotifications();
      if (!initResult) {
        return {
          success: false,
          error: 'Failed to initialize notification system.'
        };
      }

      // Load user preferences
      await this.loadPreferences();

      // Load scheduled notifications
      await this.loadScheduledNotifications();

      // Load existing scheduled notifications from device
      await this.syncWithDeviceNotifications();

      this.isInitialized = true;
      console.log('✅ Notification service initialized');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Failed to initialize notification service:', error);
      return {
        success: false,
        error: 'Failed to initialize notification service.'
      };
    }
  }

  /**
   * Schedule bus arrival alarm
   */
  public async scheduleBusArrivalAlarm(
    busId: string,
    busName: string,
    stoppageName: string,
    arrivalTime: Date,
    minutesBefore?: number
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Notification service not initialized.'
        };
      }

      // Check if bus alarms are enabled
      if (!this.preferences.busAlarms) {
        return {
          success: false,
          error: 'Bus alarms are disabled in preferences.'
        };
      }

      // Check quiet hours
      if (this.isQuietHours(arrivalTime)) {
        console.log('🔕 Notification skipped due to quiet hours');
        return {
          success: false,
          error: 'Notification time is within quiet hours.'
        };
      }

      const alarmMinutes = minutesBefore || this.preferences.defaultAlarmMinutes;
      const notificationId = await scheduleBusAlarm(stoppageName, arrivalTime, busName, alarmMinutes);

      if (notificationId) {
        // Save to our tracking
        const scheduledNotification: ScheduledNotification = {
          id: notificationId,
          type: NOTIFICATION_TYPES.BUS_ALARM,
          title: `🚌 Bus Arrival Alert`,
          body: `Your bus "${busName}" will arrive at ${stoppageName} in ${alarmMinutes} minutes!`,
          scheduledTime: new Date(arrivalTime.getTime() - (alarmMinutes * 60 * 1000)),
          data: {
            busId,
            busName,
            stoppageName,
            arrivalTime: arrivalTime.toISOString(),
            minutesBefore: alarmMinutes
          },
          isActive: true
        };

        this.scheduledNotifications.set(notificationId, scheduledNotification);
        await this.saveScheduledNotifications();

        console.log(`🔔 Bus alarm scheduled: ${notificationId}`);
        return { success: true, notificationId };

      } else {
        return {
          success: false,
          error: 'Failed to schedule bus alarm.'
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to schedule bus alarm:', error);
      return {
        success: false,
        error: 'Failed to schedule bus alarm.'
      };
    }
  }

  /**
   * Cancel scheduled notification
   */
  public async cancelScheduledNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await cancelNotification(notificationId);

      // Remove from our tracking
      this.scheduledNotifications.delete(notificationId);
      await this.saveScheduledNotifications();

      console.log(`🔕 Notification cancelled: ${notificationId}`);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Failed to cancel notification:', error);
      return {
        success: false,
        error: 'Failed to cancel notification.'
      };
    }
  }

  /**
   * Cancel all bus alarms for a specific bus
   */
  public async cancelAllBusAlarms(busId: string): Promise<{ success: boolean; cancelled: number; error?: string }> {
    try {
      let cancelled = 0;

      for (const [notificationId, notification] of this.scheduledNotifications) {
        if (notification.data?.busId === busId && notification.isActive) {
          await cancelNotification(notificationId);
          notification.isActive = false;
          cancelled++;
        }
      }

      await this.saveScheduledNotifications();

      console.log(`🔕 Cancelled ${cancelled} alarms for bus: ${busId}`);
      return { success: true, cancelled };

    } catch (error: any) {
      console.error('❌ Failed to cancel bus alarms:', error);
      return {
        success: false,
        cancelled: 0,
        error: 'Failed to cancel bus alarms.'
      };
    }
  }

  /**
   * Get scheduled notifications
   */
  public async getScheduledNotifications(type?: string): Promise<{ success: boolean; notifications?: ScheduledNotification[]; error?: string }> {
    try {
      let notifications = Array.from(this.scheduledNotifications.values());

      if (type) {
        notifications = notifications.filter(n => n.type === type);
      }

      // Sort by scheduled time
      notifications.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

      return { success: true, notifications };

    } catch (error: any) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return {
        success: false,
        error: 'Failed to get scheduled notifications.'
      };
    }
  }

  /**
   * Show immediate notification
   */
  public async showNotification(
    title: string,
    body: string,
    type?: string,
    data?: any
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Notification service not initialized.'
        };
      }

      // Check if notification type is enabled
      if (type && !this.isNotificationTypeEnabled(type)) {
        console.log(`🔕 ${type} notifications are disabled`);
        return {
          success: false,
          error: `${type} notifications are disabled.`
        };
      }

      const notificationId = await showImmediateNotification(title, body, data);

      // Save to history
      await this.saveNotificationToHistory({
        id: notificationId || Date.now().toString(),
        title,
        body,
        type: type || NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
        timestamp: new Date(),
        data
      });

      console.log(`🔔 Immediate notification shown: ${notificationId}`);
      return { success: true, notificationId };

    } catch (error: any) {
      console.error('❌ Failed to show notification:', error);
      return {
        success: false,
        error: 'Failed to show notification.'
      };
    }
  }

  /**
   * Show bus update notification
   */
  public async showBusUpdateNotification(
    busName: string,
    updateMessage: string,
    busId?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.showNotification(
      `🚌 ${busName} Update`,
      updateMessage,
      NOTIFICATION_TYPES.BUS_UPDATE,
      { busId, busName }
    );
  }

  /**
   * Show search suggestion notification
   */
  public async showSearchSuggestionNotification(
    suggestion: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.showNotification(
      '🔍 Search Suggestion',
      suggestion,
      NOTIFICATION_TYPES.SEARCH_SUGGESTION
    );
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<{ success: boolean; error?: string }> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await this.savePreferences();
      console.log('✅ Notification preferences updated');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Failed to update preferences:', error);
      return {
        success: false,
        error: 'Failed to update preferences.'
      };
    }
  }

  /**
   * Get notification preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Check if notification type is enabled
   */
  private isNotificationTypeEnabled(type: string): boolean {
    switch (type) {
      case NOTIFICATION_TYPES.BUS_ALARM:
        return this.preferences.busAlarms;
      case NOTIFICATION_TYPES.BUS_UPDATE:
        return this.preferences.busUpdates;
      case NOTIFICATION_TYPES.SEARCH_SUGGESTION:
        return this.preferences.searchSuggestions;
      case 'promotional':
        return this.preferences.promotional;
      default:
        return true;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(notificationTime: Date): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const notificationHour = notificationTime.getHours();
    const notificationMinutes = notificationTime.getMinutes();
    const notificationTimeInMinutes = notificationHour * 60 + notificationMinutes;

    const [quietStartHour, quietStartMinutes] = this.preferences.quietHours.startTime.split(':').map(Number);
    const [quietEndHour, quietEndMinutes] = this.preferences.quietHours.endTime.split(':').map(Number);

    const quietStartInMinutes = quietStartHour * 60 + quietStartMinutes;
    const quietEndInMinutes = quietEndHour * 60 + quietEndMinutes;

    if (quietStartInMinutes > quietEndInMinutes) {
      // Quiet hours span midnight (e.g., 22:00 to 07:00)
      return notificationTimeInMinutes >= quietStartInMinutes || notificationTimeInMinutes <= quietEndInMinutes;
    } else {
      // Quiet hours within same day
      return notificationTimeInMinutes >= quietStartInMinutes && notificationTimeInMinutes <= quietEndInMinutes;
    }
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NotificationService.STORAGE_KEYS.NOTIFICATION_PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...parsed };
        console.log('📥 Notification preferences loaded');
      }
    } catch (error) {
      console.error('❌ Failed to load preferences:', error);
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        NotificationService.STORAGE_KEYS.NOTIFICATION_PREFERENCES,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
    }
  }

  /**
   * Load scheduled notifications from storage
   */
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NotificationService.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      if (stored) {
        const notifications = JSON.parse(stored) as ScheduledNotification[];
        notifications.forEach(notification => {
          notification.scheduledTime = new Date(notification.scheduledTime);
          this.scheduledNotifications.set(notification.id, notification);
        });
        console.log(`📥 Loaded ${notifications.length} scheduled notifications`);
      }
    } catch (error) {
      console.error('❌ Failed to load scheduled notifications:', error);
    }
  }

  /**
   * Save scheduled notifications to storage
   */
  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.scheduledNotifications.values());
      await AsyncStorage.setItem(
        NotificationService.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('❌ Failed to save scheduled notifications:', error);
    }
  }

  /**
   * Sync with device notifications
   */
  private async syncWithDeviceNotifications(): Promise<void> {
    try {
      const deviceNotifications = await getScheduledNotifications();

      // Remove notifications that no longer exist on device
      for (const [id, notification] of this.scheduledNotifications) {
        const existsOnDevice = deviceNotifications.some(n => n.identifier === id);
        if (!existsOnDevice) {
          notification.isActive = false;
        }
      }

      await this.saveScheduledNotifications();
      console.log('🔄 Synced with device notifications');

    } catch (error) {
      console.error('❌ Failed to sync with device notifications:', error);
    }
  }

  /**
   * Save notification to history
   */
  private async saveNotificationToHistory(notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    timestamp: Date;
    data?: any;
  }): Promise<void> {
    try {
      const historyKey = NotificationService.STORAGE_KEYS.NOTIFICATION_HISTORY;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      let history = [];

      if (existingHistory) {
        history = JSON.parse(existingHistory);
      }

      // Add new notification
      history.push(notification);

      // Keep only last 100 notifications
      history = history.slice(-100);

      await AsyncStorage.setItem(historyKey, JSON.stringify(history));

    } catch (error) {
      console.error('❌ Failed to save notification to history:', error);
    }
  }

  /**
   * Get notification history
   */
  public async getNotificationHistory(limit: number = 50): Promise<{ success: boolean; history?: any[]; error?: string }> {
    try {
      const historyKey = NotificationService.STORAGE_KEYS.NOTIFICATION_HISTORY;
      const historyData = await AsyncStorage.getItem(historyKey);

      if (historyData) {
        const history = JSON.parse(historyData);
        return {
          success: true,
          history: history.slice(-limit).reverse() // Most recent first
        };
      }

      return { success: true, history: [] };

    } catch (error: any) {
      console.error('❌ Failed to get notification history:', error);
      return {
        success: false,
        error: 'Failed to get notification history.'
      };
    }
  }

  /**
   * Clear notification history
   */
  public async clearNotificationHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      await AsyncStorage.removeItem(NotificationService.STORAGE_KEYS.NOTIFICATION_HISTORY);
      console.log('🗑️ Notification history cleared');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Failed to clear notification history:', error);
      return {
        success: false,
        error: 'Failed to clear notification history.'
      };
    }
  }

  /**
   * Get notification statistics
   */
  public async getStatistics(): Promise<{
    totalScheduled: number;
    activeNotifications: number;
    notificationTypes: Record<string, number>;
    preferences: NotificationPreferences;
  }> {
    const notifications = Array.from(this.scheduledNotifications.values());
    const activeNotifications = notifications.filter(n => n.isActive);
    const notificationTypes: Record<string, number> = {};

    notifications.forEach(notification => {
      notificationTypes[notification.type] = (notificationTypes[notification.type] || 0) + 1;
    });

    return {
      totalScheduled: notifications.length,
      activeNotifications: activeNotifications.length,
      notificationTypes,
      preferences: this.getPreferences()
    };
  }
}

/**
 * Export service instance and interfaces
 */
const notificationService = new NotificationService();

export default notificationService;
export { NotificationPreferences, ScheduledNotification };