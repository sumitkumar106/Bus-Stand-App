/**
 * Date Utilities
 *
 * Expert-level date manipulation utilities for:
 * - Date formatting and parsing
 * - Short code generation from stand names
 * - Time zone handling
 * - Date validation
 * - Bus schedule calculations
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import { Platform } from 'react-native';

/**
 * Date Formats Constants
 */
export const DATE_FORMATS = {
  DISPLAY_DATE: 'DD MMM YYYY', // 31 May 2024
  DISPLAY_DATE_SHORT: 'DD MMM', // 31 May
  DISPLAY_TIME: 'HH:mm', // 14:30
  DISPLAY_TIME_12H: 'hh:mm A', // 02:30 PM
  ISO_DATE: 'YYYY-MM-DD', // 2024-05-31
  ISO_DATETIME: 'YYYY-MM-DD HH:mm:ss', // 2024-05-31 14:30:00
  SCHEDULE_TIME: 'HH:mm', // 05:50
  API_DATE: 'YYYY-MM-DDTHH:mm:ssZ', // ISO 8601
} as const;

/**
 * Days of Week Constants
 */
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export const DAYS_OF_WEEK_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
] as const;

export const DAYS_OF_WEEK_SHORT = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
] as const;

/**
 * Time Zones (India Standard Time)
 */
export const TIME_ZONES = {
  IST: 'Asia/Kolkata',
  UTC: 'UTC',
} as const;

/**
 * Date Utility Class
 */
class DateUtils {
  /**
   * Generate short code from stand name
   * Examples: "Harinagar" → "HN", "Patna To Nagar" → "PTN", "Delhi" → "D"
   */
  public static generateShortCode(standName: string): string {
    if (!standName || typeof standName !== 'string') {
      return '';
    }

    // Remove extra spaces and convert to title case
    const cleanName = standName.trim().replace(/\s+/g, ' ');

    // Split into words and take first letter of each word
    const words = cleanName.split(' ');
    const shortCode = words
      .map(word => word.charAt(0).toUpperCase())
      .join('');

    // If short code is too long (more than 3 chars), take first 3
    return shortCode.length > 3 ? shortCode.substring(0, 3) : shortCode;
  }

  /**
   * Format date to display format
   */
  public static formatDate(date: Date | string, format: keyof typeof DATE_FORMATS = 'DISPLAY_DATE'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    switch (format) {
      case 'DISPLAY_DATE':
        return `${day} ${month} ${year}`;
      case 'DISPLAY_DATE_SHORT':
        return `${day} ${month}`;
      case 'DISPLAY_TIME':
        return `${hours}:${minutes}`;
      case 'DISPLAY_TIME_12H':
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      case 'ISO_DATE':
        return `${year}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case 'ISO_DATETIME':
        return `${year}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours}:${minutes}:00`;
      case 'SCHEDULE_TIME':
        return `${hours}:${minutes}`;
      case 'API_DATE':
        return d.toISOString();
      default:
        return d.toLocaleDateString();
    }
  }

  /**
   * Parse time string to Date object
   */
  public static parseTime(timeString: string, baseDate?: Date): Date {
    if (!timeString) {
      return new Date();
    }

    const base = baseDate || new Date();
    const [hours, minutes] = timeString.split(':').map(Number);

    const date = new Date(base);
    date.setHours(hours, minutes, 0, 0);

    return date;
  }

  /**
   * Calculate duration between two times
   */
  public static calculateDuration(startTime: string, endTime: string): string {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    // Handle crossing midnight
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) {
      return `${diffMinutes}m`;
    } else if (diffMinutes === 0) {
      return `${diffHours}h`;
    } else {
      return `${diffHours}h ${diffMinutes}m`;
    }
  }

  /**
   * Add minutes to a time string
   */
  public static addMinutesToTime(timeString: string, minutes: number): string {
    const date = this.parseTime(timeString);
    date.setMinutes(date.getMinutes() + minutes);
    return this.formatDate(date, 'DISPLAY_TIME');
  }

  /**
   * Check if time string is valid
   */
  public static isValidTime(timeString: string): boolean {
    if (!timeString) return false;

    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(timeString)) return false;

    const [hours, minutes] = timeString.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  /**
   * Get day of week number
   */
  public static getDayOfWeek(date?: Date): number {
    const d = date || new Date();
    return d.getDay();
  }

  /**
   * Get day name
   */
  public static getDayName(date?: Date): string {
    const d = date || new Date();
    return DAYS_OF_WEEK_NAMES[d.getDay()];
  }

  /**
   * Get day short name
   */
  public static getDayShortName(date?: Date): string {
    const d = date || new Date();
    return DAYS_OF_WEEK_SHORT[d.getDay()];
  }

  /**
   * Check if date is today
   */
  public static isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  /**
   * Check if date is tomorrow
   */
  public static isTomorrow(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return d.getDate() === tomorrow.getDate() &&
           d.getMonth() === tomorrow.getMonth() &&
           d.getFullYear() === tomorrow.getFullYear();
  }

  /**
   * Check if date is within next N days
   */
  public static isWithinDays(date: Date | string, days: number): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return d >= now && d <= futureDate;
  }

  /**
   * Get date range for next N days
   */
  public static getDateRange(days: number): Date[] {
    const dates: Date[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  }

  /**
   * Convert running days array to human readable string
   */
  public static formatRunningDays(runningDays: boolean[]): string {
    if (!runningDays || runningDays.length !== 7) {
      return 'Invalid running days';
    }

    const dayNames = DAYS_OF_WEEK_SHORT.filter((_, index) => runningDays[index]);

    if (dayNames.length === 7) {
      return 'Daily';
    } else if (dayNames.length === 5 && !runningDays[0] && !runningDays[6]) {
      return 'Weekdays';
    } else if (dayNames.length === 2 && runningDays[0] && runningDays[6]) {
      return 'Weekends';
    } else {
      return dayNames.join(', ');
    }
  }

  /**
   * Check if bus runs on specific day
   */
  public static busRunsOnDay(runningDays: boolean[], date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = d.getDay();

    return runningDays[dayOfWeek] || false;
  }

  /**
   * Get next available date for bus
   */
  public static getNextAvailableDate(runningDays: boolean[], startDate?: Date): Date | null {
    const start = startDate || new Date();
    const current = new Date(start);

    // Check next 30 days
    for (let i = 0; i < 30; i++) {
      if (this.busRunsOnDay(runningDays, current)) {
        return new Date(current);
      }
      current.setDate(current.getDate() + 1);
    }

    return null;
  }

  /**
   * Convert minutes to human readable format
   */
  public static minutesToReadable(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Get current time in HH:mm format
   */
  public static getCurrentTime(): string {
    return this.formatDate(new Date(), 'DISPLAY_TIME');
  }

  /**
   * Check if time has passed
   */
  public static hasTimePassed(timeString: string): boolean {
    const targetTime = this.parseTime(timeString);
    const now = new Date();

    // If target time is today
    const targetToday = new Date();
    targetToday.setHours(targetTime.getHours(), targetTime.getMinutes(), 0, 0);

    return now > targetToday;
  }

  /**
   * Get time until specific time
   */
  public static getTimeUntil(timeString: string): number {
    const targetTime = this.parseTime(timeString);
    const now = new Date();

    // If target time is today
    let targetToday = new Date();
    targetToday.setHours(targetTime.getHours(), targetTime.getMinutes(), 0, 0);

    // If time has passed today, use tomorrow
    if (targetToday <= now) {
      targetToday = new Date(targetToday);
      targetToday.setDate(targetToday.getDate() + 1);
    }

    return Math.floor((targetToday.getTime() - now.getTime()) / (1000 * 60));
  }

  /**
   * Validate date string
   */
  public static isValidDateString(dateString: string): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 30 minutes")
   */
  public static formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 0) {
      const absMinutes = Math.abs(diffMinutes);
      if (absMinutes < 60) {
        return `${absMinutes} minutes ago`;
      } else if (absMinutes < 1440) {
        return `${Math.floor(absMinutes / 60)} hours ago`;
      } else {
        return `${Math.floor(absMinutes / 1440)} days ago`;
      }
    } else {
      if (diffMinutes < 60) {
        return `in ${diffMinutes} minutes`;
      } else if (diffMinutes < 1440) {
        return `in ${Math.floor(diffMinutes / 60)} hours`;
      } else {
        return `in ${Math.floor(diffMinutes / 1440)} days`;
      }
    }
  }
}

/**
 * Export DateUtils class and constants
 */
export default DateUtils;
export { DATE_FORMATS, DAYS_OF_WEEK, DAYS_OF_WEEK_NAMES, DAYS_OF_WEEK_SHORT, TIME_ZONES };