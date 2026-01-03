'use client';

import { useCallback, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
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

  const handleMapMove = useCallback(
    (evt: any) => {
      if (onMapMove && evt.viewState) {
        const { longitude, latitude } = evt.viewState;
        if (longitude !== undefined && latitude !== undefined) {
          onMapMove({ lat: latitude, lng: longitude });
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

  return (
    <Map
      mapboxAccessToken={mapboxToken}
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onMove={handleMapMove}
    >
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

