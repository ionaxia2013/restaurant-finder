'use client';

import { Restaurant } from '@/lib/api';

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onRestaurantDetails: (placeId: string) => void;
}

const PRICE_LABELS = ['Free', '$', '$$', '$$$', '$$$$'];

export default function RestaurantList({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  onRestaurantDetails,
}: RestaurantListProps) {
  if (restaurants.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No restaurants found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.place_id}
          onClick={() => onRestaurantSelect(restaurant)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedRestaurant?.place_id === restaurant.place_id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
              {restaurant.address && (
                <p className="text-sm text-gray-600 mt-1">{restaurant.address}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {restaurant.rating && (
                  <span className="text-sm text-gray-700">
                    ⭐ {restaurant.rating.toFixed(1)}
                    {restaurant.user_ratings_total && (
                      <span className="text-gray-500">
                        {' '}({restaurant.user_ratings_total})
                      </span>
                    )}
                  </span>
                )}
                {restaurant.price_level !== null && (
                  <span className="text-sm text-gray-700">
                    {PRICE_LABELS[restaurant.price_level]}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestaurantDetails(restaurant.place_id);
              }}
              className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

