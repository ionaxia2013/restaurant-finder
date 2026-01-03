'use client';

import { useState, useEffect, useCallback } from 'react';
import MapComponent from '@/components/Map';
import Filters from '@/components/Filters';
import RestaurantList from '@/components/RestaurantList';
import RestaurantDetail from '@/components/RestaurantDetail';
import { searchRestaurants, getRestaurantDetails, Restaurant, RestaurantDetail as RestaurantDetailType } from '@/lib/api';

// Default center: San Francisco Bay Area (Union Square)
const DEFAULT_CENTER = { lat: 37.7879, lng: -122.4095 };

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantDetail, setRestaurantDetail] = useState<RestaurantDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [cuisineType, setCuisineType] = useState('');
  const [radius, setRadius] = useState(1609); // 1 mile in meters (default)
  
  // Filters visibility state
  const [showFilters, setShowFilters] = useState(true);

  // Search restaurants
  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchRestaurants({
        lat: center.lat,
        lng: center.lng,
        radius,
        max_price: maxPrice ?? undefined,
        cuisine_type: cuisineType || undefined,
      });
      setRestaurants(results.restaurants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [center, radius, maxPrice, cuisineType]);

  // Initial search on mount
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Handle restaurant details
  const handleRestaurantDetails = async (placeId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await getRestaurantDetails(placeId);
      setRestaurantDetail(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurant details');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Finder</h1>
        <p className="text-sm text-gray-600 mt-1">
          Discover restaurants with accurate filters
        </p>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters and List */}
        <div className="w-96 bg-gray-50 flex flex-col overflow-hidden">
          {/* Filters Section */}
          {showFilters && (
            <div className="border-b bg-white flex-shrink-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase">Filters</span>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-lg font-bold leading-none"
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <Filters
                  maxPrice={maxPrice}
                  cuisineType={cuisineType}
                  radius={radius}
                  onMaxPriceChange={setMaxPrice}
                  onCuisineTypeChange={setCuisineType}
                  onRadiusChange={setRadius}
                />
                
                {/* Search Button */}
                <button
                  onClick={performSearch}
                  disabled={loading}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : 'Search Restaurants'}
                </button>
              </div>
            </div>
          )}

          {/* Show Filters Button (when hidden) */}
          {!showFilters && (
            <div className="border-b bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowFilters(true)}
                className="w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                aria-label="Show filters"
              >
                <span>Filters</span>
                <span className="text-gray-400">⌃</span>
              </button>
            </div>
          )}

          {/* Restaurant List Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b bg-gray-50 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Restaurants ({restaurants.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {loading && restaurants.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Loading restaurants...</div>
              ) : (
                <RestaurantList
                  restaurants={restaurants}
                  selectedRestaurant={selectedRestaurant}
                  onRestaurantSelect={setSelectedRestaurant}
                  onRestaurantDetails={handleRestaurantDetails}
                />
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {loading && restaurants.length > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Updating results...</p>
            </div>
          )}
          <MapComponent
            restaurants={restaurants}
            center={center}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={setSelectedRestaurant}
            onMapMove={setCenter}
          />
        </div>
      </div>

      {/* Restaurant Detail Modal */}
      {restaurantDetail && (
        <RestaurantDetail
          restaurant={restaurantDetail}
          onClose={() => setRestaurantDetail(null)}
        />
      )}
    </div>
  );
}
