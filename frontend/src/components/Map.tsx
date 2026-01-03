'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Restaurant } from '@/lib/api';

interface MapComponentProps {
  restaurants: Restaurant[];
  center: { lat: number; lng: number };
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant | null) => void;
  onMapMove?: (center: { lat: number; lng: number }) => void;
}

export default function MapComponent({
  restaurants,
  center,
  selectedRestaurant,
  onRestaurantSelect,
  onMapMove,
}: MapComponentProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  const mapRef = useRef<any>(null);
  
  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: 16, // Zoom level for ~0.2 mile radius view
  });
  const lastCenterRef = useRef({ lat: center.lat, lng: center.lng });

  // Update viewState when center prop changes (e.g., from address search)
  // Only update center coordinates, preserve zoom level
  useEffect(() => {
    const centerChanged = 
      Math.abs(lastCenterRef.current.lat - center.lat) > 0.0001 ||
      Math.abs(lastCenterRef.current.lng - center.lng) > 0.0001;
    
    if (centerChanged) {
      lastCenterRef.current = { lat: center.lat, lng: center.lng };
      setViewState(prev => ({
        longitude: center.lng,
        latitude: center.lat,
        zoom: prev.zoom, // Preserve current zoom level - don't reset on center changes
      }));
    }
  }, [center.lng, center.lat]);

  const handleMapMove = useCallback(
    (evt: any) => {
      if (evt.viewState) {
        setViewState(evt.viewState);
        if (onMapMove) {
          const { longitude, latitude } = evt.viewState;
          if (longitude !== undefined && latitude !== undefined) {
            // Only update parent center if it's a significant pan (not just zoom)
            const currentCenter = lastCenterRef.current;
            const distance = Math.sqrt(
              Math.pow(latitude - currentCenter.lat, 2) + 
              Math.pow(longitude - currentCenter.lng, 2)
            );
            // Only update if moved more than ~100 meters
            if (distance > 0.001) {
              onMapMove({ lat: latitude, lng: longitude });
            }
          }
        }
      }
    },
    [onMapMove]
  );

  const markers = useMemo(
    () =>
      restaurants.map((restaurant) => (
        <Marker
          key={restaurant.place_id}
          longitude={restaurant.lng}
          latitude={restaurant.lat}
          anchor="bottom"
          onClick={() => onRestaurantSelect(restaurant)}
        >
          <div
            className={`cursor-pointer transition-transform ${
              selectedRestaurant?.place_id === restaurant.place_id
                ? 'scale-125'
                : 'hover:scale-110'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                selectedRestaurant?.place_id === restaurant.place_id
                  ? 'bg-blue-600'
                  : 'bg-red-500'
              }`}
            />
          </div>
        </Marker>
      )),
    [restaurants, selectedRestaurant, onRestaurantSelect]
  );

  if (!mapboxToken) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <p className="text-gray-600">
          Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file
        </p>
      </div>
    );
  }

  // Force map resize when container size changes
  useEffect(() => {
    const resizeMap = () => {
      if (mapRef.current) {
        try {
          const map = mapRef.current.getMap();
          if (map && typeof map.resize === 'function') {
            // Use requestAnimationFrame for smoother resize
            requestAnimationFrame(() => {
              map.resize();
            });
          }
        } catch (e) {
          // Map might not be ready yet, ignore
        }
      }
    };

    // Listen for window resize events (including programmatically triggered ones from parent)
    window.addEventListener('resize', resizeMap);
    
    // Also resize after a short delay to handle initial load and container size changes
    const timeoutId = setTimeout(resizeMap, 200);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', resizeMap);
    };
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={mapboxToken}
      {...viewState}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onMove={handleMapMove}
      onLoad={() => {
        // Resize map after it loads
        if (mapRef.current) {
          const map = mapRef.current.getMap();
          if (map) {
            requestAnimationFrame(() => {
              map.resize();
            });
          }
        }
      }}
      scrollZoom={true}
      doubleClickZoom={true}
      touchZoom={true}
      touchRotate={false}
      dragRotate={false}
      minZoom={10}
      maxZoom={20}
    >
      <NavigationControl position="top-right" />
      {markers}
      {selectedRestaurant && (
        <Popup
          longitude={selectedRestaurant.lng}
          latitude={selectedRestaurant.lat}
          anchor="bottom"
          onClose={() => onRestaurantSelect(null)}
          closeButton={true}
          closeOnClick={false}
        >
          <div className="p-3 bg-white min-w-[200px]">
            <h3 className="font-semibold text-base text-gray-900 mb-1">
              {selectedRestaurant.name}
            </h3>
            {selectedRestaurant.rating && (
              <p className="text-sm text-gray-700">
                ⭐ {selectedRestaurant.rating.toFixed(1)}
                {selectedRestaurant.user_ratings_total && (
                  <span className="text-gray-500 ml-1">
                    ({selectedRestaurant.user_ratings_total})
                  </span>
                )}
              </p>
            )}
            {selectedRestaurant.address && (
              <p className="text-xs text-gray-600 mt-1">
                {selectedRestaurant.address}
              </p>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}

