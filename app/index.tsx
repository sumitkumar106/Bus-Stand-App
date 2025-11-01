/**
 * Home Screen (index.tsx)
 *
 * Main passenger interface for searching buses
 * Features:
 * - From/To stand search with autocomplete
 * - Date picker for journey planning
 * - Alternative bus number/name search
 * - Search history display
 * - Bottom navigation
 * - AdMob banner integration
 *
 * Expert-level production code with comprehensive comments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Search History Item Interface
 */
interface SearchHistoryItem {
  id: string;
  busName: string;
  fromStand: string;
  fromStandShortCode: string;
  toStand: string;
  toStandShortCode: string;
  startTime: string;
  endTime: string;
  duration: string;
  searchDate: string;
}

/**
 * Home Screen Component
 */
export default function HomeScreen() {
  const router = useRouter();

  // State management
  const [fromStand, setFromStand] = useState('');
  const [toStand, setToStand] = useState('');
  const [busSearch, setBusSearch] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Suggestions for autocomplete (will be fetched from Firebase)
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  /**
   * Load search history from AsyncStorage on mount
   */
  useEffect(() => {
    loadSearchHistory();
    checkConnectivity();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Check network connectivity
   */
  const checkConnectivity = async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected ?? false);
  };

  /**
   * Load search history from AsyncStorage
   */
  const loadSearchHistory = async () => {
    try {
      const historyJSON = await AsyncStorage.getItem('searchHistory');
      if (historyJSON) {
        const history = JSON.parse(historyJSON);
        setSearchHistory(history.slice(0, 10)); // Show last 10 searches
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  /**
   * Generate short code from stand name
   * Example: "Harinagar" → "HN", "Patna To Nagar" → "PTN"
   */
  const generateShortCode = (standName: string): string => {
    return standName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  /**
   * Handle search button press
   */
  const handleSearch = async () => {
    if (!fromStand || !toStand) {
      alert('Please select both From and To stands');
      return;
    }

    // Save search to history
    const newSearch: SearchHistoryItem = {
      id: Date.now().toString(),
      busName: 'Bus name', // Will be updated after fetching results
      fromStand,
      fromStandShortCode: generateShortCode(fromStand),
      toStand,
      toStandShortCode: generateShortCode(toStand),
      startTime: '--:--',
      endTime: '--:--',
      duration: '--h --m',
      searchDate: selectedDate.toISOString(),
    };

    // Save to AsyncStorage
    try {
      const updatedHistory = [newSearch, ...searchHistory].slice(0, 50);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setSearchHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
    }

    // Navigate to search results
    router.push({
      pathname: '/(passenger)/search-results',
      params: {
        fromStand,
        toStand,
        date: selectedDate.toISOString(),
      },
    });
  };

  /**
   * Handle bus name/number search
   */
  const handleBusSearch = () => {
    if (!busSearch) {
      alert('Please enter bus name or number');
      return;
    }

    // Navigate to search results with bus filter
    router.push({
      pathname: '/(passenger)/search-results',
      params: {
        busSearch,
        date: selectedDate.toISOString(),
      },
    });
  };

  /**
   * Handle from stand input change
   */
  const handleFromStandChange = (text: string) => {
    setFromStand(text);

    // TODO: Fetch suggestions from Firebase
    // For now, using sample data
    if (text.length > 0) {
      const sampleStands = ['Patna', 'Harinagar', 'Sonpur', 'Fatuha', 'Danapur'];
      const filtered = sampleStands.filter(stand =>
        stand.toLowerCase().includes(text.toLowerCase())
      );
      setFromSuggestions(filtered);
      setShowFromSuggestions(true);
    } else {
      setShowFromSuggestions(false);
    }
  };

  /**
   * Handle to stand input change
   */
  const handleToStandChange = (text: string) => {
    setToStand(text);

    // TODO: Fetch suggestions from Firebase
    // For now, using sample data
    if (text.length > 0) {
      const sampleStands = ['Patna', 'Harinagar', 'Sonpur', 'Fatuha', 'Danapur'];
      const filtered = sampleStands.filter(stand =>
        stand.toLowerCase().includes(text.toLowerCase())
      );
      setToSuggestions(filtered);
      setShowToSuggestions(true);
    } else {
      setShowToSuggestions(false);
    }
  };

  /**
   * Render search history item
   */
  const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setFromStand(item.fromStand);
        setToStand(item.toStand);
      }}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyBusName}>{item.busName}</Text>
      </View>
      <View style={styles.historyRoute}>
        <View style={styles.historyStand}>
          <Text style={styles.historyShortCode}>{item.fromStandShortCode}</Text>
          <Text style={styles.historyStandName}>{item.fromStand}</Text>
        </View>
        <Text style={styles.historyArrow}>→</Text>
        <View style={styles.historyStand}>
          <Text style={styles.historyShortCode}>{item.toStandShortCode}</Text>
          <Text style={styles.historyStandName}>{item.toStand}</Text>
        </View>
      </View>
      <View style={styles.historyTiming}>
        <Text style={styles.historyTime}>{item.startTime}</Text>
        <Text style={styles.historyDuration}>{item.duration}</Text>
        <Text style={styles.historyTime}>{item.endTime}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome to bus stand</Text>
          <Text style={styles.headerSubtitle}>Where are you going to next?</Text>
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>📵 Offline Mode</Text>
            </View>
          )}
        </View>

        {/* Search Form */}
        <View style={styles.searchForm}>
          {/* From Stand Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🚏</Text>
              <TextInput
                style={styles.input}
                placeholder="From Stand"
                placeholderTextColor="#999999"
                value={fromStand}
                onChangeText={handleFromStandChange}
                onFocus={() => fromStand && setShowFromSuggestions(true)}
              />
            </View>
            {/* Suggestions dropdown */}
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {fromSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setFromStand(suggestion);
                      setShowFromSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* To Stand Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🎯</Text>
              <TextInput
                style={styles.input}
                placeholder="To Stand"
                placeholderTextColor="#999999"
                value={toStand}
                onChangeText={handleToStandChange}
                onFocus={() => toStand && setShowToSuggestions(true)}
              />
            </View>
            {/* Suggestions dropdown */}
            {showToSuggestions && toSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {toSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setToStand(suggestion);
                      setShowToSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Search Button */}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search Bus</Text>
          </TouchableOpacity>

          {/* Alternative Search */}
          <View style={styles.alternativeSearch}>
            <Text style={styles.alternativeSearchLabel}>OR</Text>
            <View style={styles.busSearchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.busSearchInput}
                placeholder="Search by bus name or number"
                placeholderTextColor="#999999"
                value={busSearch}
                onChangeText={setBusSearch}
                onSubmitEditing={handleBusSearch}
              />
            </View>
          </View>
        </View>

        {/* Search History */}
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>Search History</Text>
          {searchHistory.length > 0 ? (
            <FlatList
              data={searchHistory}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.historyList}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>
                No search history yet
              </Text>
              <Text style={styles.emptyHistorySubtext}>
                Start searching for buses to see your history here
              </Text>
            </View>
          )}
        </View>

        {/* AdMob Banner Placeholder */}
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Ad Banner Here</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.navButtonTextActive}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/(passenger)/search-results')}
        >
          <Text style={styles.navButtonText}>🚌 Bus Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for bottom navigation
  },

  // Header styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  offlineText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },

  // Search form styles
  searchForm: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  inputIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#000000',
  },
  searchButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },

  // Alternative search styles
  alternativeSearch: {
    marginTop: 25,
  },
  alternativeSearchLabel: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 15,
  },
  busSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  busSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },

  // Search history styles
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  historySectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  historyList: {
    paddingBottom: 10,
  },
  historyItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  historyHeader: {
    marginBottom: 8,
  },
  historyBusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  historyRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyStand: {
    flex: 1,
  },
  historyShortCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  historyStandName: {
    fontSize: 13,
    color: '#666666',
  },
  historyArrow: {
    fontSize: 20,
    color: '#000000',
    marginHorizontal: 10,
  },
  historyTiming: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTime: {
    fontSize: 14,
    color: '#666666',
  },
  historyDuration: {
    fontSize: 14,
    color: '#999999',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },

  // Ad banner styles
  adBanner: {
    backgroundColor: '#FFEB3B',
    height: 60,
    marginHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  adText: {
    fontSize: 14,
    color: '#666666',
  },

  // Bottom navigation styles
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navButtonTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  navButtonText: {
    fontSize: 14,
    color: '#999999',
  },
});
