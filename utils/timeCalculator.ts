/**
 * Time Calculator Utilities
 *
 * Expert-level time calculation utilities for:
 * - Journey time calculations
 * - Bus schedule optimization
 * - Arrival time predictions
 * - Delay calculations
 * - Time zone handling
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import DateUtils from './dateUtils';

/**
 * Time Calculator Class
 */
class TimeCalculator {
  /**
   * Calculate total journey time between two times
   */
  public static calculateJourneyTime(startTime: string, endTime: string): string {
    if (!DateUtils.isValidTime(startTime) || !DateUtils.isValidTime(endTime)) {
      return 'Invalid time';
    }

    return DateUtils.calculateDuration(startTime, endTime);
  }

  /**
   * Calculate arrival time at each stoppage
   */
  public static calculateStoppageArrivalTimes(
    startTime: string,
    stoppages: Array<{
      distanceFromStart: number;
      averageSpeed: number; // km/h
    }>
  ): Array<{ stoppageIndex: number; arrivalTime: string; travelTime: number }> {
    const results = [];
    let currentTime = DateUtils.parseTime(startTime);

    for (let i = 0; i < stoppages.length; i++) {
      const stoppage = stoppages[i];
      const previousDistance = i > 0 ? stoppages[i - 1].distanceFromStart : 0;
      const segmentDistance = stoppage.distanceFromStart - previousDistance;

      if (segmentDistance > 0 && stoppage.averageSpeed > 0) {
        // Calculate travel time in minutes
        const travelTimeMinutes = Math.floor((segmentDistance / stoppage.averageSpeed) * 60);
        currentTime = new Date(currentTime.getTime() + (travelTimeMinutes * 60 * 1000));

        results.push({
          stoppageIndex: i,
          arrivalTime: DateUtils.formatDate(currentTime, 'DISPLAY_TIME'),
          travelTime: travelTimeMinutes
        });
      }
    }

    return results;
  }

  /**
   * Calculate estimated arrival time with delay
   */
  public static calculateArrivalWithDelay(
    scheduledTime: string,
    delayMinutes: number
  ): string {
    const scheduled = DateUtils.parseTime(scheduledTime);
    scheduled.setMinutes(scheduled.getMinutes() + delayMinutes);
    return DateUtils.formatDate(scheduled, 'DISPLAY_TIME');
  }

  /**
   * Calculate delay percentage
   */
  public static calculateDelayPercentage(actualTime: string, scheduledTime: string): number {
    const actual = DateUtils.parseTime(actualTime);
    const scheduled = DateUtils.parseTime(scheduledTime);

    // Handle crossing midnight
    if (actual < scheduled) {
      actual.setDate(actual.getDate() + 1);
    }

    const delayMinutes = (actual.getTime() - scheduled.getTime()) / (1000 * 60);

    // Calculate percentage based on journey time (assuming average journey time of 4 hours)
    const averageJourneyMinutes = 240;
    return Math.min(100, Math.max(-100, (delayMinutes / averageJourneyMinutes) * 100));
  }

  /**
   * Check if bus is on time (within 15 minutes)
   */
  public static isOnTime(actualTime: string, scheduledTime: string, toleranceMinutes: number = 15): boolean {
    const actual = DateUtils.parseTime(actualTime);
    const scheduled = DateUtils.parseTime(scheduledTime);

    // Handle crossing midnight
    if (actual < scheduled) {
      actual.setDate(actual.getDate() + 1);
    }

    const diffMinutes = Math.abs((actual.getTime() - scheduled.getTime()) / (1000 * 60));
    return diffMinutes <= toleranceMinutes;
  }

  /**
   * Calculate bus frequency (buses per hour)
   */
  public static calculateBusFrequency(busTimes: string[]): number {
    if (!busTimes || busTimes.length < 2) {
      return 0;
    }

    const sortedTimes = busTimes.sort();
    const firstTime = DateUtils.parseTime(sortedTimes[0]);
    const lastTime = DateUtils.parseTime(sortedTimes[sortedTimes.length - 1]);

    // Handle crossing midnight
    if (lastTime < firstTime) {
      lastTime.setDate(lastTime.getDate() + 1);
    }

    const totalHours = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60 * 60);
    return busTimes.length / totalHours;
  }

  /**
   * Calculate wait time until next bus
   */
  public static calculateWaitTime(nextBusTime: string): number {
    const nextBus = DateUtils.parseTime(nextBusTime);
    const now = new Date();

    // Set next bus time to today
    let nextBusToday = new Date();
    nextBusToday.setHours(nextBus.getHours(), nextBus.getMinutes(), 0, 0);

    // If next bus time has passed, use tomorrow
    if (nextBusToday <= now) {
      nextBusToday.setDate(nextBusToday.getDate() + 1);
    }

    return Math.floor((nextBusToday.getTime() - now.getTime()) / (1000 * 60));
  }

  /**
   * Calculate peak hours status
   */
  public static isPeakHour(time: string): boolean {
    const hour = parseInt(time.split(':')[0]);

    // Morning peak: 7:00 - 10:00
    // Evening peak: 17:00 - 20:00
    return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
  }

  /**
   * Calculate travel time with traffic factor
   */
  public static calculateTravelTimeWithTraffic(
    distance: number,
    baseSpeed: number,
    trafficFactor: number
  ): number {
    // trafficFactor: 1.0 (normal), 1.5 (heavy), 2.0 (very heavy)
    const adjustedSpeed = baseSpeed / trafficFactor;
    return Math.floor((distance / adjustedSpeed) * 60); // Return minutes
  }

  /**
   * Calculate optimal departure time
   */
  public static calculateOptimalDepartureTime(
    arrivalTime: string,
    journeyTimeMinutes: number,
    bufferMinutes: number = 15
  ): string {
    const arrival = DateUtils.parseTime(arrivalTime);
    arrival.setMinutes(arrival.getMinutes() - journeyTimeMinutes - bufferMinutes);
    return DateUtils.formatDate(arrival, 'DISPLAY_TIME');
  }

  /**
   * Calculate layover time between trips
   */
  public static calculateLayoverTime(
    arrivalTime: string,
    nextDepartureTime: string
  ): number {
    const arrival = DateUtils.parseTime(arrivalTime);
    const departure = DateUtils.parseTime(nextDepartureTime);

    // Handle crossing midnight
    if (departure < arrival) {
      departure.setDate(departure.getDate() + 1);
    }

    return Math.floor((departure.getTime() - arrival.getTime()) / (1000 * 60));
  }

  /**
   * Calculate average speed between two points
   */
  public static calculateAverageSpeed(
    startTime: string,
    endTime: string,
    distance: number
  ): number {
    const start = DateUtils.parseTime(startTime);
    const end = DateUtils.parseTime(endTime);

    // Handle crossing midnight
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    const timeHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return timeHours > 0 ? Math.round(distance / timeHours) : 0;
  }

  /**
   * Convert minutes to time of day
   */
  public static minutesToTimeOfDay(minutesFromMidnight: number): string {
    const hours = Math.floor(minutesFromMidnight / 60) % 24;
    const minutes = minutesFromMidnight % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Convert time to minutes from midnight
   */
  public static timeToMinutesFromMidnight(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60) + minutes;
  }

  /**
   * Calculate time overlap between two time ranges
   */
  public static calculateTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): number {
    const s1 = DateUtils.timeToMinutesFromMidnight(start1);
    const e1 = DateUtils.timeToMinutesFromMidnight(end1);
    const s2 = DateUtils.timeToMinutesFromMidnight(start2);
    const e2 = DateUtils.timeToMinutesFromMidnight(end2);

    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);

    return Math.max(0, overlapEnd - overlapStart);
  }

  /**
   * Calculate bus schedule efficiency
   */
  public static calculateScheduleEfficiency(
    actualTimes: string[],
    scheduledTimes: string[]
  ): number {
    if (!actualTimes.length || !scheduledTimes.length || actualTimes.length !== scheduledTimes.length) {
      return 0;
    }

    let totalDeviation = 0;
    for (let i = 0; i < actualTimes.length; i++) {
      const deviation = Math.abs(
        DateUtils.timeToMinutesFromMidnight(actualTimes[i]) -
        DateUtils.timeToMinutesFromMidnight(scheduledTimes[i])
      );
      totalDeviation += deviation;
    }

    const averageDeviation = totalDeviation / actualTimes.length;
    const efficiency = Math.max(0, 100 - (averageDeviation / 10)); // 10 minutes = 0% efficiency
    return Math.round(efficiency);
  }

  /**
   * Generate time slots for scheduling
   */
  public static generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number
  ): string[] {
    const slots = [];
    const start = DateUtils.timeToMinutesFromMidnight(startTime);
    const end = DateUtils.timeToMinutesFromMidnight(endTime);

    for (let current = start; current <= end; current += intervalMinutes) {
      slots.push(DateUtils.minutesToTimeOfDay(current));
    }

    return slots;
  }

  /**
   * Calculate buffer time needed for connections
   */
  public static calculateConnectionBuffer(
    firstBusArrival: string,
    secondBusDeparture: string,
    minimumBuffer: number = 15
  ): number {
    const arrival = DateUtils.timeToMinutesFromMidnight(firstBusArrival);
    const departure = DateUtils.timeToMinutesFromMidnight(secondBusDeparture);

    const availableTime = departure - arrival;
    return Math.max(minimumBuffer, availableTime);
  }

  /**
   * Check if time is within rush hour
   */
  public static isRushHour(time: string): boolean {
    const hour = parseInt(time.split(':')[0]);

    // Morning rush: 8:00 - 10:00
    // Evening rush: 17:00 - 19:00
    return (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
  }

  /**
   * Calculate travel time with rush hour consideration
   */
  public static calculateTravelTimeRushHour(
    startTime: string,
    distance: number,
    normalSpeed: number,
    rushHourSpeed: number
  ): number {
    const travelTimeMinutes = Math.floor((distance / normalSpeed) * 60);
    const endHour = (parseInt(startTime.split(':')[0]) + Math.floor(travelTimeMinutes / 60)) % 24;

    // Check if journey passes through rush hour
    if (TimeCalculator.isRushHour(startTime) || TimeCalculator.isRushHour(`${endHour}:00`)) {
      return Math.floor((distance / rushHourSpeed) * 60);
    }

    return travelTimeMinutes;
  }
}

/**
 * Export TimeCalculator class
 */
export default TimeCalculator;