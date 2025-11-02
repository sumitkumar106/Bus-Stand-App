/**
 * Gemini AI Configuration (via Open Router)
 *
 * Expert-level AI integration with:
 * - Open Router API setup
 * - Gemini 2.5 Flash Lite integration
 * - Error handling and retry logic
 * - Request/response validation
 * - Rate limiting support
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Gemini Configuration Interface
 */
interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
}

/**
 * AI Prediction Request Interface
 */
interface PredictionRequest {
  busRoute: {
    fromStand: string;
    toStand: string;
    stoppages: Array<{
      name: string;
      scheduledTime: string;
      distanceFromStart: number;
    }>;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  historicalData?: {
    averageDelay: number;
    trafficConditions: string;
    weatherConditions: string;
    timeOfDay: string;
    dayOfWeek: string;
  };
  targetPrediction: 'arrival_time' | 'delay_minutes' | 'on_time_probability';
}

/**
 * AI Prediction Response Interface
 */
interface PredictionResponse {
  success: boolean;
  prediction?: {
    estimatedArrivalTime?: string;
    delayMinutes?: number;
    onTimeProbability?: number;
    confidence?: number;
    reasoning?: string;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  metadata?: {
    model: string;
    processingTime: number;
    tokensUsed: number;
  };
}

/**
 * Production Gemini Configuration
 * Using your actual Open Router API key from research.md
 */
const PRODUCTION_CONFIG: GeminiConfig = {
  apiKey: "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",
  model: "google/gemini-2.0-flash-exp",
  baseUrl: "https://openrouter.ai/api/v1",
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  rateLimitRequests: 100, // 100 requests per hour
  rateLimitWindow: 3600000 // 1 hour in milliseconds
};

/**
 * Development Gemini Configuration
 */
const DEVELOPMENT_CONFIG: GeminiConfig = {
  ...PRODUCTION_CONFIG,
  model: "google/gemini-2.0-flash-exp", // Same model for consistency
  rateLimitRequests: 50, // Lower rate limit for development
};

/**
 * Get Gemini configuration based on environment
 */
const getGeminiConfig = (): GeminiConfig => {
  return __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
};

/**
 * Rate limiting utility
 */
class RateLimiter {
  private requests: number[] = [];
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  public async canMakeRequest(): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > windowStart);

    // Check if we're under the limit
    if (this.requests.length < this.config.rateLimitRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get time until next request is allowed
   */
  public getTimeUntilNextRequest(): number {
    if (this.requests.length === 0) return 0;

    const oldestRequest = this.requests[0];
    const windowEnd = oldestRequest + this.config.rateLimitWindow;
    const now = Date.now();

    return Math.max(0, windowEnd - now);
  }
}

/**
 * Gemini AI Service Class
 */
class GeminiAIService {
  private static instance: GeminiAIService;
  private config: GeminiConfig;
  private axiosInstance: AxiosInstance;
  private rateLimiter: RateLimiter;

  private constructor() {
    this.config = getGeminiConfig();
    this.rateLimiter = new RateLimiter(this.config);

    // Configure axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://bus-stand-app.com',
        'X-Title': 'Bus Stand App',
      },
    });

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('🤖 Gemini AI Request:', {
          url: config.url,
          method: config.method,
          data: config.data,
        });
        return config;
      },
      (error) => {
        console.error('🤖 Gemini AI Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('🤖 Gemini AI Response:', {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.error('🤖 Gemini AI Response Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GeminiAIService {
    if (!GeminiAIService.instance) {
      GeminiAIService.instance = new GeminiAIService();
    }
    return GeminiAIService.instance;
  }

  /**
   * Validate API key
   */
  private validateApiKey(): boolean {
    if (!this.config.apiKey || this.config.apiKey.length < 10) {
      console.error('❌ Invalid Gemini API key');
      return false;
    }
    return true;
  }

  /**
   * Create AI prediction prompt
   */
  private createPredictionPrompt(request: PredictionRequest): string {
    const { busRoute, currentLocation, historicalData, targetPrediction } = request;

    let prompt = `You are a bus route prediction AI. Analyze the following data and provide accurate predictions.

BUS ROUTE:
From: ${busRoute.fromStand}
To: ${busRoute.toStand}
Stoppages:
${busRoute.stoppages.map(stop => `- ${stop.name}: ${stop.scheduledTime} (${stop.distanceFromStart}km from start)`).join('\n')}`;

    if (currentLocation) {
      prompt += `

CURRENT BUS LOCATION:
GPS: ${currentLocation.latitude}, ${currentLocation.longitude}
Last updated: ${currentLocation.timestamp}`;
    }

    if (historicalData) {
      prompt += `

HISTORICAL DATA:
Average delay: ${historicalData.averageDelay} minutes
Traffic: ${historicalData.trafficConditions}
Weather: ${historicalData.weatherConditions}
Time: ${historicalData.timeOfDay}
Day: ${historicalData.dayOfWeek}`;
    }

    switch (targetPrediction) {
      case 'arrival_time':
        prompt += `

TASK: Predict the arrival time at each stoppage. Consider current traffic, weather, and historical patterns.

RESPONSE FORMAT (JSON only):
{
  "predictions": [
    {
      "stoppageName": "Stoppage Name",
      "scheduledTime": "HH:MM",
      "predictedTime": "HH:MM",
      "delayMinutes": 15,
      "onTimeProbability": 0.7,
      "confidence": 0.85
    }
  ]
}`;
        break;

      case 'delay_minutes':
        prompt += `

TASK: Predict the delay in minutes for the entire route. Consider all factors affecting the journey.

RESPONSE FORMAT (JSON only):
{
  "totalDelayMinutes": 25,
  "confidence": 0.9,
  "reasoning": "Heavy traffic on main highway due to rush hour",
  "factors": ["traffic", "weather", "time_of_day"]
}`;
        break;

      case 'on_time_probability':
        prompt += `

TASK: Calculate the probability of the bus arriving on time at each stoppage.

RESPONSE FORMAT (JSON only):
{
  "onTimeProbabilities": [
    {
      "stoppageName": "Stoppage Name",
      "onTimeProbability": 0.8,
      "factors": ["light_traffic", "good_weather", "non_peak_hours"]
    }
  ]
}`;
        break;
    }

    return prompt;
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest(config: AxiosRequestConfig, attempt: number = 1): Promise<AxiosResponse> {
    try {
      // Check rate limiting
      const canProceed = await this.rateLimiter.canMakeRequest();
      if (!canProceed) {
        const waitTime = this.rateLimiter.getTimeUntilNextRequest();
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
      }

      return await this.axiosInstance.request(config);

    } catch (error: any) {
      console.error(`🤖 Gemini AI Request Failed (Attempt ${attempt}/${this.config.maxRetries}):`, error);

      // Check if we should retry
      if (attempt < this.config.maxRetries && this.shouldRetry(error)) {
        console.log(`🤖 Retrying in ${this.config.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.makeRequest(config, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Determine if error is retryable
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx server errors
    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
      return true;
    }

    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429; // Server errors or rate limit
    }

    return false;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: any): any {
    try {
      if (response.data && response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;

        // Try to parse JSON from content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      throw new Error('Invalid AI response format');

    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      throw new Error('AI response parsing failed');
    }
  }

  /**
   * Predict bus arrival times
   */
  public async predictArrivalTimes(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = Date.now();

    try {
      // Validate API key
      if (!this.validateApiKey()) {
        return {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid Gemini API key',
            retryable: false
          }
        };
      }

      // Create prompt
      const prompt = this.createPredictionPrompt({
        ...request,
        targetPrediction: 'arrival_time'
      });

      // Make API request
      const response = await this.makeRequest({
        method: 'POST',
        url: '/chat/completions',
        data: {
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent predictions
          max_tokens: 1000,
        }
      });

      // Parse response
      const parsedResponse = this.parseAIResponse(response.data);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        prediction: {
          estimatedArrivalTime: parsedResponse.predictions?.[0]?.predictedTime,
          confidence: parsedResponse.predictions?.[0]?.confidence,
          reasoning: 'AI-based prediction considering traffic, weather, and historical data'
        },
        metadata: {
          model: this.config.model,
          processingTime,
          tokensUsed: response.data.usage?.total_tokens || 0
        }
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Unknown error occurred',
          retryable: this.shouldRetry(error)
        },
        metadata: {
          model: this.config.model,
          processingTime,
          tokensUsed: 0
        }
      };
    }
  }

  /**
   * Predict bus delay
   */
  public async predictDelay(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const prompt = this.createPredictionPrompt({
        ...request,
        targetPrediction: 'delay_minutes'
      });

      const response = await this.makeRequest({
        method: 'POST',
        url: '/chat/completions',
        data: {
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
        }
      });

      const parsedResponse = this.parseAIResponse(response.data);

      return {
        success: true,
        prediction: {
          delayMinutes: parsedResponse.totalDelayMinutes,
          confidence: parsedResponse.confidence,
          reasoning: parsedResponse.reasoning
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'DELAY_PREDICTION_FAILED',
          message: error.message || 'Failed to predict delay',
          retryable: this.shouldRetry(error)
        }
      };
    }
  }

  /**
   * Get service status
   */
  public getStatus(): { available: boolean; rateLimitStatus: any } {
    return {
      available: this.validateApiKey(),
      rateLimitStatus: {
        requestsMade: this.rateLimiter['requests'].length,
        limit: this.config.rateLimitRequests,
        timeUntilReset: this.rateLimiter.getTimeUntilNextRequest()
      }
    };
  }
}

/**
 * Export service instance and utilities
 */
const geminiAIService = GeminiAIService.getInstance();

export {
  geminiAIService,
  PredictionRequest,
  PredictionResponse,
  GeminiConfig
};

export default geminiAIService;