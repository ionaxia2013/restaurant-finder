'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { getAutocompleteSuggestions, geocodeByPlaceId, AutocompletePrediction } from '@/lib/api';

interface AddressSearchProps {
  onLocationFound: (location: { lat: number; lng: number; address: string }) => void;
}

export default function AddressSearch({ onLocationFound }: AddressSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch autocomplete suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const result = await getAutocompleteSuggestions(searchQuery);
        setSuggestions(result.predictions);
        setShowSuggestions(result.predictions.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        // Silently fail for autocomplete errors
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300); // Debounce for 300ms
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = async (prediction: AutocompletePrediction) => {
    setSearchQuery(prediction.description);
    setShowSuggestions(false);
    setIsSearching(true);

    try {
      const result = await geocodeByPlaceId(prediction.place_id);
      onLocationFound({
        lat: result.lat,
        lng: result.lng,
        address: result.formatted_address || prediction.description,
      });
      setSearchQuery(''); // Clear search after successful geocode
    } catch (err) {
      // Handle error
      setSearchQuery(prediction.description);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    // If a suggestion is selected, use it
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }

    // Otherwise, try to geocode the text directly
    setIsSearching(true);
    try {
      const { geocodeAddress } = await import('@/lib/api');
      const result = await geocodeAddress(searchQuery.trim());
      onLocationFound({
        lat: result.lat,
        lng: result.lng,
        address: result.formatted_address,
      });
      setSearchQuery('');
      setShowSuggestions(false);
    } catch (err) {
      // Handle error - maybe show in UI
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search for an address or location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
              disabled={isSearching}
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                      index === selectedIndex ? 'bg-gray-100' : ''
                    } ${index > 0 ? 'border-t border-gray-200' : ''}`}
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {suggestion.main_text || suggestion.description.split(',')[0]}
                    </div>
                    {suggestion.secondary_text && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {suggestion.secondary_text}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
}
