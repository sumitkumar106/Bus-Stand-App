/**
 * Validation Utilities
 *
 * Expert-level validation utilities for:
 * - Form validation
 * - Data validation
 * - Input sanitization
 * - Error message handling
 * - Type checking
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

/**
 * Validation Result Interface
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

/**
 * Form Validation Schema Interface
 */
interface ValidationSchema {
  [fieldName: string]: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => ValidationResult;
    message?: string;
  };
}

/**
 * Validator Class
 */
class Validator {
  /**
   * Email validation
   */
  public static validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        error: 'Email is required',
        field: 'email'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        isValid: false,
        error: 'Please enter a valid email address',
        field: 'email'
      };
    }

    return { isValid: true };
  }

  /**
   * Phone number validation (Indian format)
   */
  public static validatePhoneNumber(phone: string): ValidationResult {
    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        error: 'Phone number is required',
        field: 'phone'
      };
    }

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Indian phone number validation (10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return {
        isValid: false,
        error: 'Please enter a valid 10-digit phone number',
        field: 'phone'
      };
    }

    return { isValid: true };
  }

  /**
   * Name validation
   */
  public static validateName(name: string, minLength: number = 2, maxLength: number = 50): ValidationResult {
    if (!name || typeof name !== 'string') {
      return {
        isValid: false,
        error: 'Name is required',
        field: 'name'
      };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < minLength) {
      return {
        isValid: false,
        error: `Name must be at least ${minLength} characters long`,
        field: 'name'
      };
    }

    if (trimmedName.length > maxLength) {
      return {
        isValid: false,
        error: `Name must be less than ${maxLength} characters long`,
        field: 'name'
      };
    }

    // Allow only letters, spaces, and basic punctuation
    const nameRegex = /^[a-zA-Z\s\-'.]+$/;
    if (!nameRegex.test(trimmedName)) {
      return {
        isValid: false,
        error: 'Name can only contain letters, spaces, hyphens, and apostrophes',
        field: 'name'
      };
    }

    return { isValid: true };
  }

  /**
   * Bus name validation
   */
  public static validateBusName(busName: string): ValidationResult {
    if (!busName || typeof busName !== 'string') {
      return {
        isValid: false,
        error: 'Bus name is required',
        field: 'busName'
      };
    }

    const trimmedName = busName.trim();

    if (trimmedName.length < 2) {
      return {
        isValid: false,
        error: 'Bus name must be at least 2 characters long',
        field: 'busName'
      };
    }

    if (trimmedName.length > 50) {
      return {
        isValid: false,
        error: 'Bus name must be less than 50 characters long',
        field: 'busName'
      };
    }

    return { isValid: true };
  }

  /**
   * Bus number validation
   */
  public static validateBusNumber(busNumber: string): ValidationResult {
    if (!busNumber || typeof busNumber !== 'string') {
      return {
        isValid: false,
        error: 'Bus number is required',
        field: 'busNumber'
      };
    }

    const trimmedNumber = busNumber.trim().toUpperCase();

    // Indian vehicle registration format (e.g., BH01AC1234)
    const busNumberRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
    if (!busNumberRegex.test(trimmedNumber)) {
      return {
        isValid: false,
        error: 'Please enter a valid bus number (e.g., BH01AC1234)',
        field: 'busNumber'
      };
    }

    return { isValid: true };
  }

  /**
   * Stand name validation
   */
  public static validateStandName(standName: string): ValidationResult {
    if (!standName || typeof standName !== 'string') {
      return {
        isValid: false,
        error: 'Stand name is required',
        field: 'standName'
      };
    }

    const trimmedName = standName.trim();

    if (trimmedName.length < 2) {
      return {
        isValid: false,
        error: 'Stand name must be at least 2 characters long',
        field: 'standName'
      };
    }

    if (trimmedName.length > 100) {
      return {
        isValid: false,
        error: 'Stand name must be less than 100 characters long',
        field: 'standName'
      };
    }

    // Allow letters, numbers, spaces, and basic punctuation
    const standNameRegex = /^[a-zA-Z0-9\s\-\.,']+$/;
    if (!standNameRegex.test(trimmedName)) {
      return {
        isValid: false,
        error: 'Stand name contains invalid characters',
        field: 'standName'
      };
    }

    return { isValid: true };
  }

  /**
   * Time validation (HH:MM format)
   */
  public static validateTime(time: string): ValidationResult {
    if (!time || typeof time !== 'string') {
      return {
        isValid: false,
        error: 'Time is required',
        field: 'time'
      };
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time.trim())) {
      return {
        isValid: false,
        error: 'Please enter a valid time in HH:MM format',
        field: 'time'
      };
    }

    return { isValid: true };
  }

  /**
   * Password validation
   */
  public static validatePassword(password: string, minLength: number = 8): ValidationResult {
    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        error: 'Password is required',
        field: 'password'
      };
    }

    if (password.length < minLength) {
      return {
        isValid: false,
        error: `Password must be at least ${minLength} characters long`,
        field: 'password'
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        error: 'Password must be less than 128 characters long',
        field: 'password'
      };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter',
        field: 'password'
      };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one lowercase letter',
        field: 'password'
      };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number',
        field: 'password'
      };
    }

    return { isValid: true };
  }

  /**
   * User type validation
   */
  public static validateUserType(userType: string): ValidationResult {
    if (!userType || typeof userType !== 'string') {
      return {
        isValid: false,
        error: 'User type is required',
        field: 'userType'
      };
    }

    const validTypes = ['passenger', 'driver'];
    if (!validTypes.includes(userType.toLowerCase())) {
      return {
        isValid: false,
        error: 'User type must be either "passenger" or "driver"',
        field: 'userType'
      };
    }

    return { isValid: true };
  }

  /**
   * Ticket price validation
   */
  public static validateTicketPrice(price: number | string): ValidationResult {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numericPrice) || numericPrice < 0) {
      return {
        isValid: false,
        error: 'Please enter a valid ticket price',
        field: 'ticketPrice'
      };
    }

    if (numericPrice > 10000) {
      return {
        isValid: false,
        error: 'Ticket price cannot exceed ₹10,000',
        field: 'ticketPrice'
      };
    }

    return { isValid: true };
  }

  /**
   * Distance validation
   */
  public static validateDistance(distance: number | string): ValidationResult {
    const numericDistance = typeof distance === 'string' ? parseFloat(distance) : distance;

    if (isNaN(numericDistance) || numericDistance < 0) {
      return {
        isValid: false,
        error: 'Please enter a valid distance',
        field: 'distance'
      };
    }

    if (numericDistance > 5000) {
      return {
        isValid: false,
        error: 'Distance cannot exceed 5000 km',
        field: 'distance'
      };
    }

    return { isValid: true };
  }

  /**
   * Running days validation
   */
  public static validateRunningDays(runningDays: boolean[]): ValidationResult {
    if (!Array.isArray(runningDays) || runningDays.length !== 7) {
      return {
        isValid: false,
        error: 'Running days must be an array of 7 boolean values',
        field: 'runningDays'
      };
    }

    // Check if at least one day is selected
    if (!runningDays.some(day => day === true)) {
      return {
        isValid: false,
        error: 'Bus must run on at least one day',
        field: 'runningDays'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate form against schema
   */
  public static validateForm(data: any, schema: ValidationSchema): {
    isValid: boolean;
    errors: Array<{ field: string; error: string }>;
  } {
    const errors: Array<{ field: string; error: string }> = [];

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = data[fieldName];

      // Check if required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: fieldName,
          error: rules.message || `${fieldName} is required`
        });
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Check minimum length
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push({
          field: fieldName,
          error: rules.message || `${fieldName} must be at least ${rules.minLength} characters long`
        });
      }

      // Check maximum length
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push({
          field: fieldName,
          error: rules.message || `${fieldName} must be less than ${rules.maxLength} characters long`
        });
      }

      // Check pattern
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push({
          field: fieldName,
          error: rules.message || `${fieldName} format is invalid`
        });
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (!customResult.isValid) {
          errors.push({
            field: fieldName,
            error: customResult.error || `${fieldName} is invalid`
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize input string
   */
  public static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate coordinates
   */
  public static validateCoordinates(lat: number, lng: number): ValidationResult {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return {
        isValid: false,
        error: 'Coordinates must be numbers',
        field: 'coordinates'
      };
    }

    if (lat < -90 || lat > 90) {
      return {
        isValid: false,
        error: 'Latitude must be between -90 and 90',
        field: 'latitude'
      };
    }

    if (lng < -180 || lng > 180) {
      return {
        isValid: false,
        error: 'Longitude must be between -180 and 180',
        field: 'longitude'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate search parameters
   */
  public static validateSearchParams(params: {
    fromStand: string;
    toStand: string;
    date?: string;
  }): ValidationResult {
    if (!params.fromStand || !params.toStand) {
      return {
        isValid: false,
        error: 'Please select both From and To stands',
        field: 'search'
      };
    }

    if (params.fromStand.trim().toLowerCase() === params.toStand.trim().toLowerCase()) {
      return {
        isValid: false,
        error: 'From and To stands cannot be the same',
        field: 'search'
      };
    }

    if (params.date) {
      const searchDate = new Date(params.date);
      if (isNaN(searchDate.getTime())) {
        return {
          isValid: false,
          error: 'Invalid search date',
          field: 'date'
        };
      }

      // Check if date is in the past
      if (searchDate < new Date().setHours(0, 0, 0, 0)) {
        return {
          isValid: false,
          error: 'Search date cannot be in the past',
          field: 'date'
        };
      }

      // Check if date is more than 30 days in the future
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      if (searchDate > maxDate) {
        return {
          isValid: false,
          error: 'Search date cannot be more than 30 days in the future',
          field: 'date'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Generic required field validation
   */
  public static validateRequired(value: any, fieldName: string): ValidationResult {
    if (value === undefined || value === null || value === '') {
      return {
        isValid: false,
        error: `${fieldName} is required`,
        field: fieldName
      };
    }

    return { isValid: true };
  }
}

/**
 * Export Validator class and interfaces
 */
export default Validator;
export { ValidationResult, ValidationSchema };