'use client';

import { RestaurantDetail as RestaurantDetailType } from '@/lib/api';

interface RestaurantDetailProps {
  restaurant: RestaurantDetailType;
  onClose: () => void;
}

const PRICE_LABELS = ['Free', '$', '$$', '$$$', '$$$$'];

export default function RestaurantDetail({ restaurant, onClose }: RestaurantDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Address */}
          {restaurant.address && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Address</h3>
              <p className="text-gray-900">{restaurant.address}</p>
            </div>
          )}

          {/* Rating and Price */}
          <div className="flex gap-4">
            {restaurant.rating && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Rating</h3>
                <p className="text-gray-900">
                  ⭐ {restaurant.rating.toFixed(1)}
                  {restaurant.user_ratings_total && (
                    <span className="text-gray-600">
                      {' '}({restaurant.user_ratings_total} reviews)
                    </span>
                  )}
                </p>
              </div>
            )}
            {restaurant.price_level !== null && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Price Level</h3>
                <p className="text-gray-900">{PRICE_LABELS[restaurant.price_level]}</p>
              </div>
            )}
          </div>

          {/* Phone */}
          {restaurant.phone_number && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Phone</h3>
              <a
                href={`tel:${restaurant.phone_number}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {restaurant.phone_number}
              </a>
            </div>
          )}

          {/* Website */}
          {restaurant.website && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Website</h3>
              <a
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {restaurant.website}
              </a>
            </div>
          )}

          {/* Menu */}
          {restaurant.menu_url && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Menu</h3>
              <a
                href={restaurant.menu_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                View Menu →
              </a>
            </div>
          )}

          {/* Opening Hours */}
          {restaurant.opening_hours && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Opening Hours</h3>
              {restaurant.opening_hours.open_now !== undefined && (
                <p className="text-sm mb-2">
                  <span
                    className={`font-semibold ${
                      restaurant.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {restaurant.opening_hours.open_now ? 'Open Now' : 'Closed'}
                  </span>
                </p>
              )}
              {restaurant.opening_hours.weekday_text && (
                <ul className="text-sm text-gray-700 space-y-1">
                  {restaurant.opening_hours.weekday_text.map((day: string, index: number) => (
                    <li key={index}>{day}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Types */}
          {restaurant.types.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.types
                  .filter((type) => !['point_of_interest', 'establishment'].includes(type))
                  .map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

