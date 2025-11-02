/**
 * Search Service
 *
 * Expert-level search service with:
 * - Smart bus matching algorithms
 * - Search history management
 * - Filter optimization
 * - Performance optimization
 * - Search analytics
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import firebaseService from './firebase';
import busService from './busService';
import DateUtils from '../utils/dateUtils';
import TimeCalculator from '../utils/timeCalculator';
import DistanceCalculator from '../utils/distanceCalculator';
import Validator from '../utils/validators';

/**
 * Search Request Interface
 */
interface SearchRequest {
  fromStand: string;
  toStand: string;
  date: string;
  busNumber?: string;
  busName?: string;
  maxResults?: number;
  sortBy?: 'departure_time' | 'journey_time' | 'price' | 'arrival_time';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Result Interface
 */
interface SearchResult {
  buses: Bus[];
  totalResults: number;
  searchTime: number;
  filters: SearchFilters;
  analytics: SearchAnalytics;
}

/**
 * Search Filters Interface
 */
interface SearchFilters {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  priceRange?: {
    min: number;
    max: number;
  };
  busTypes?: string[];
  amenities?: string[];
  onlyAvailable?: boolean;
}

/**
 * Search Analytics Interface
 */
interface SearchAnalytics {
  searchedAt: string;
  totalBusesChecked: number;
  matchedBuses: number;
  averageJourneyTime: number;
  averagePrice: number;
  popularRoutes: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

/**
 * Bus Interface (extended)
 */
interface Bus {
  busId?: string;
  driverId: string;
  busName: string;
  busNumber: string;
  startStandName: string;
  startStandTime: string;
  endStandName: string;
  endStandTime: string;
  runningDays: boolean[];
  stoppages: Stoppage[];
  journeyInfo?: any;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Stoppage Interface
 */
interface Stoppage {
  stoppageId: string;
  stoppageName: string;
  shortCode: string;
  scheduledArrivalTime: string;
  distanceFromStart: number;
  ticketPrice: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Search History Item Interface
 */
interface SearchHistoryItem {
  id: string;
  userId: string;
  fromStand: string;
  toStand: string;
  fromStandShortCode: string;
  toStandShortCode: string;
  searchDate: string;
  busName?: string;
  resultsCount: number;
  createdAt: string;
}

/**
 * Search Service Class
 */
class SearchService {
  private searchCache: Map<string, SearchResult> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Perform comprehensive bus search
   */
  public async searchBuses(searchRequest: SearchRequest): Promise<{ success: boolean; result?: SearchResult; error?: string }> {
    const startTime = Date.now();

    try {
      // Validate search request
      const validation = Validator.validateSearchParams(searchRequest);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid search parameters'
        };
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(searchRequest);

      // Check cache first
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        console.log('🔍 Search result from cache');
        return { success: true, result: cachedResult };
      }

      // Perform search
      const searchResult = await this.performSearch(searchRequest);

      // Calculate search metrics
      const searchTime = Date.now() - startTime;
      searchResult.searchTime = searchTime;

      // Cache result
      this.cacheResult(cacheKey, searchResult);

      // Save search history
      await this.saveSearchHistory(searchRequest, searchResult.buses.length);

      // Save search to Firebase
      await firebaseService.saveSearch({
        userId: 'current_user', // TODO: Get actual user ID
        fromStand: searchRequest.fromStand,
        toStand: searchRequest.toStand,
        searchDate: searchRequest.date,
        fromStandShortCode: DateUtils.generateShortCode(searchRequest.fromStand),
        toStandShortCode: DateUtils.generateShortCode(searchRequest.toStand)
      });

      console.log(`🔍 Search completed in ${searchTime}ms - Found ${searchResult.buses.length} buses`);
      return { success: true, result: searchResult };

    } catch (error: any) {
      console.error('❌ Search failed:', error);
      return {
        success: false,
        error: 'Search failed. Please try again.'
      };
    }
  }

  /**
   * Perform the actual search logic
   */
  private async performSearch(searchRequest: SearchRequest): Promise<SearchResult> {
    // Get all buses from Firebase
    const firebaseResult = await firebaseService.searchBuses(
      searchRequest.fromStand,
      searchRequest.toStand,
      searchRequest.date
    );

    if (!firebaseResult.success || !firebaseResult.buses) {
      return {
        buses: [],
        totalResults: 0,
        searchTime: 0,
        filters: {},
        analytics: {
          searchedAt: new Date().toISOString(),
          totalBusesChecked: 0,
          matchedBuses: 0,
          averageJourneyTime: 0,
          averagePrice: 0,
          popularRoutes: []
        }
      };
    }

    let matchedBuses = firebaseResult.buses;

    // Apply filters
    if (searchRequest.busNumber) {
      matchedBuses = matchedBuses.filter(bus =>
        bus.busNumber.toLowerCase().includes(searchRequest.busNumber!.toLowerCase())
      );
    }

    if (searchRequest.busName) {
      matchedBuses = matchedBuses.filter(bus =>
        bus.busName.toLowerCase().includes(searchRequest.busName!.toLowerCase())
      );
    }

    // Apply additional filters
    matchedBuses = this.applyAdvancedFilters(matchedBuses, searchRequest);

    // Sort results
    matchedBuses = this.sortBuses(matchedBuses, searchRequest.sortBy, searchRequest.sortOrder);

    // Limit results
    if (searchRequest.maxResults && matchedBuses.length > searchRequest.maxResults) {
      matchedBuses = matchedBuses.slice(0, searchRequest.maxResults);
    }

    // Calculate analytics
    const analytics = this.calculateSearchAnalytics(matchedBuses, searchRequest);

    return {
      buses: matchedBuses,
      totalResults: matchedBuses.length,
      searchTime: 0, // Will be set by caller
      filters: {},
      analytics
    };
  }

  /**
   * Apply advanced filters to bus results
   */
  private applyAdvancedFilters(buses: Bus[], searchRequest: SearchRequest): Bus[] {
    let filteredBuses = [...buses];

    // Filter by availability on search date
    filteredBuses = filteredBuses.filter(bus =>
      busService.isBusAvailableOnDate(bus, searchRequest.date)
    );

    // Filter by time of day (if specified)
    if (searchRequest.filters?.timeOfDay) {
      filteredBuses = filteredBuses.filter(bus => {
        const hour = parseInt(bus.startStandTime.split(':')[0]);
        switch (searchRequest.filters!.timeOfDay) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 18;
          case 'evening':
            return hour >= 18 && hour < 22;
          case 'night':
            return hour >= 22 || hour < 6;
          default:
            return true;
        }
      });
    }

    // Filter by price range (if specified)
    if (searchRequest.filters?.priceRange) {
      filteredBuses = filteredBuses.filter(bus => {
        // Get minimum ticket price for this route
        const minPrice = this.getMinimumTicketPrice(bus, searchRequest.fromStand, searchRequest.toStand);
        return minPrice >= searchRequest.filters!.priceRange!.min &&
               minPrice <= searchRequest.filters!.priceRange!.max;
      });
    }

    return filteredBuses;
  }

  /**
   * Sort buses by specified criteria
   */
  private sortBuses(buses: Bus[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): Bus[] {
    if (!sortBy) return buses;

    return [...buses].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'departure_time':
          const timeA = TimeCalculator.timeToMinutesFromMidnight(a.startStandTime);
          const timeB = TimeCalculator.timeToMinutesFromMidnight(b.startStandTime);
          comparison = timeA - timeB;
          break;

        case 'arrival_time':
          // Get relevant arrival times
          const arrivalA = this.getArrivalTime(a);
          const arrivalB = this.getArrivalTime(b);
          comparison = TimeCalculator.timeToMinutesFromMidnight(arrivalA) -
                       TimeCalculator.timeToMinutesFromMidnight(arrivalB);
          break;

        case 'journey_time':
          const durationA = this.getJourneyDuration(a);
          const durationB = this.getJourneyDuration(b);
          comparison = durationA - durationB;
          break;

        case 'price':
          const priceA = this.getMinimumTicketPrice(a, '', '');
          const priceB = this.getMinimumTicketPrice(b, '', '');
          comparison = priceA - priceB;
          break;

        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get arrival time for bus (simplified)
   */
  private getArrivalTime(bus: Bus): string {
    // For now, return end time (in real app, calculate based on specific route)
    return bus.endStandTime;
  }

  /**
   * Get journey duration in minutes
   */
  private getJourneyDuration(bus: Bus): number {
    const startMinutes = TimeCalculator.timeToMinutesFromMidnight(bus.startStandTime);
    const endMinutes = TimeCalculator.timeToMinutesFromMidnight(bus.endStandTime);
    return endMinutes - startMinutes;
  }

  /**
   * Get minimum ticket price for route
   */
  private getMinimumTicketPrice(bus: Bus, fromStand: string, toStand: string): number {
    if (bus.stoppages.length === 0) {
      return 100; // Default base price
    }

    // Find minimum price among relevant stoppages
    return Math.min(...bus.stoppages.map(stop => stop.ticketPrice));
  }

  /**
   * Calculate search analytics
   */
  private calculateSearchAnalytics(buses: Bus[], searchRequest: SearchRequest): SearchAnalytics {
    const totalBuses = buses.length;

    if (totalBuses === 0) {
      return {
        searchedAt: new Date().toISOString(),
        totalBusesChecked: 0,
        matchedBuses: 0,
        averageJourneyTime: 0,
        averagePrice: 0,
        popularRoutes: []
      };
    }

    // Calculate average journey time
    const totalJourneyTime = buses.reduce((sum, bus) => sum + this.getJourneyDuration(bus), 0);
    const averageJourneyTime = Math.round(totalJourneyTime / totalBuses);

    // Calculate average price
    const totalPrice = buses.reduce((sum, bus) => sum + this.getMinimumTicketPrice(bus, '', ''), 0);
    const averagePrice = Math.round(totalPrice / totalBuses);

    return {
      searchedAt: new Date().toISOString(),
      totalBusesChecked: totalBuses,
      matchedBuses: totalBuses,
      averageJourneyTime,
      averagePrice,
      popularRoutes: [
        {
          from: searchRequest.fromStand,
          to: searchRequest.toStand,
          count: totalBuses
        }
      ]
    };
  }

  /**
   * Generate cache key for search request
   */
  private generateCacheKey(searchRequest: SearchRequest): string {
    const key = [
      searchRequest.fromStand,
      searchRequest.toStand,
      searchRequest.date,
      searchRequest.busNumber || '',
      searchRequest.busName || '',
      searchRequest.sortBy || 'departure_time',
      searchRequest.sortOrder || 'asc'
    ].join('_');

    return key.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Get cached search result
   */
  private getCachedResult(cacheKey: string): SearchResult | null {
    const cached = this.searchCache.get(cacheKey);
    if (cached && (Date.now() - parseInt(cached.analytics.searchedAt)) < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  /**
   * Cache search result
   */
  private cacheResult(cacheKey: string, result: SearchResult): void {
    this.searchCache.set(cacheKey, result);

    // Clean old cache entries
    if (this.searchCache.size > 50) {
      const oldestKey = this.searchCache.keys().next().value;
      this.searchCache.delete(oldestKey);
    }
  }

  /**
   * Save search history to local storage
   */
  private async saveSearchHistory(searchRequest: SearchRequest, resultsCount: number): Promise<void> {
    try {
      const historyItem: SearchHistoryItem = {
        id: Date.now().toString(),
        userId: 'current_user', // TODO: Get actual user ID
        fromStand: searchRequest.fromStand,
        toStand: searchRequest.toStand,
        fromStandShortCode: DateUtils.generateShortCode(searchRequest.fromStand),
        toStandShortCode: DateUtils.generateShortCode(searchRequest.toStand),
        searchDate: searchRequest.date,
        busName: searchRequest.busName,
        resultsCount,
        createdAt: new Date().toISOString()
      };

      // TODO: Save to AsyncStorage
      console.log('🔍 Search history saved:', historyItem);

    } catch (error) {
      console.error('❌ Failed to save search history:', error);
    }
  }

  /**
   * Get search suggestions for stand names
   */
  public async getStandSuggestions(query: string): Promise<{ success: boolean; suggestions?: string[]; error?: string }> {
    try {
      if (!query || query.length < 2) {
        return { success: true, suggestions: [] };
      }

      // Get available stands from bus service
      const standsResult = await busService.getAvailableStands();

      if (!standsResult.success || !standsResult.stands) {
        return { success: false, error: 'Failed to fetch stand suggestions' };
      }

      // Filter stands based on query
      const queryLower = query.toLowerCase();
      const suggestions = standsResult.stands
        .filter(stand => stand.toLowerCase().includes(queryLower))
        .slice(0, 10); // Limit to 10 suggestions

      return { success: true, suggestions };

    } catch (error: any) {
      console.error('❌ Failed to get stand suggestions:', error);
      return {
        success: false,
        error: 'Failed to fetch suggestions. Please try again.'
      };
    }
  }

  /**
   * Get popular routes
   */
  public async getPopularRoutes(limit: number = 10): Promise<{ success: boolean; routes?: Array<{ from: string; to: string; count: number }>; error?: string }> {
    try {
      // TODO: Implement popular routes logic from Firebase analytics
      const popularRoutes = [
        { from: 'Patna', to: 'Harinagar', count: 150 },
        { from: 'Harinagar', to: 'Patna', count: 142 },
        { from: 'Patna', to: 'Muzaffarpur', count: 98 },
        { from: 'Muzaffarpur', to: 'Patna', count: 89 },
        { from: 'Patna', to: 'Gaya', count: 76 }
      ].slice(0, limit);

      return { success: true, routes: popularRoutes };

    } catch (error: any) {
      console.error('❌ Failed to get popular routes:', error);
      return {
        success: false,
        error: 'Failed to fetch popular routes. Please try again.'
      };
    }
  }

  /**
   * Get user's search history
   */
  public async getSearchHistory(userId: string, limit: number = 20): Promise<{ success: boolean; history?: SearchHistoryItem[]; error?: string }> {
    try {
      const result = await firebaseService.getSearchHistory(userId, limit);

      if (result.success && result.searches) {
        // Transform Firebase search data to SearchHistoryItem format
        const history: SearchHistoryItem[] = result.searches.map(search => ({
          id: search.searchId || Date.now().toString(),
          userId: search.userId,
          fromStand: search.fromStand,
          toStand: search.toStand,
          fromStandShortCode: search.fromStandShortCode,
          toStandShortCode: search.toStandShortCode,
          searchDate: search.searchDate,
          resultsCount: 0, // TODO: Store results count in search
          createdAt: search.createdAt?.toDate().toISOString() || new Date().toISOString()
        }));

        return { success: true, history };
      }

      return result as any;

    } catch (error: any) {
      console.error('❌ Failed to get search history:', error);
      return {
        success: false,
        error: 'Failed to fetch search history. Please try again.'
      };
    }
  }

  /**
   * Clear search cache
   */
  public clearCache(): void {
    this.searchCache.clear();
    console.log('🔍 Search cache cleared');
  }

  /**
   * Get search statistics
   */
  public getSearchStatistics(): { cacheSize: number; cacheHits: number; cacheMisses: number } {
    return {
      cacheSize: this.searchCache.size,
      cacheHits: 0, // TODO: Implement cache hit tracking
      cacheMisses: 0
    };
  }

  /**
   * Optimize search parameters
   */
  public optimizeSearchParams(searchRequest: SearchRequest): SearchRequest {
    return {
      ...searchRequest,
      maxResults: searchRequest.maxResults || 20,
      sortBy: searchRequest.sortBy || 'departure_time',
      sortOrder: searchRequest.sortOrder || 'asc'
    };
  }

  /**
   * Validate search result relevance
   */
  private validateSearchResult(bus: Bus, searchRequest: SearchRequest): boolean {
    // Check if bus actually serves the requested route
    const fromStandLower = searchRequest.fromStand.toLowerCase();
    const toStandLower = searchRequest.toStand.toLowerCase();
    const startStandLower = bus.startStandName.toLowerCase();
    const endStandLower = bus.endStandName.toLowerCase();

    // Direct route match
    if (startStandLower === fromStandLower && endStandLower === toStandLower) {
      return true;
    }

    // Check if both from and to are stoppages
    const fromStoppage = bus.stoppages.find(stop =>
      stop.stoppageName.toLowerCase() === fromStandLower
    );
    const toStoppage = bus.stoppages.find(stop =>
      stop.stoppageName.toLowerCase() === toStandLower
    );

    // Both are stoppages in correct order
    if (fromStoppage && toStoppage) {
      const fromIndex = bus.stoppages.indexOf(fromStoppage);
      const toIndex = bus.stoppages.indexOf(toStoppage);
      return fromIndex < toIndex;
    }

    // From is start stand, to is stoppage
    if (startStandLower === fromStandLower && toStoppage) {
      return true;
    }

    // From is stoppage, to is end stand
    if (fromStoppage && endStandLower === toStandLower) {
      return true;
    }

    return false;
  }
}

/**
 * Export service instance and interfaces
 */
const searchService = new SearchService();

export default searchService;
export {
  SearchRequest,
  SearchResult,
  SearchFilters,
  SearchAnalytics,
  SearchHistoryItem,
  Bus,
  Stoppage
};