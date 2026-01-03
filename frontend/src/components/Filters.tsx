'use client';

interface FiltersProps {
  maxPrice: number | null;
  cuisineType: string;
  radius: number;
  onMaxPriceChange: (price: number | null) => void;
  onCuisineTypeChange: (cuisine: string) => void;
  onRadiusChange: (radius: number) => void;
}

const PRICE_LABELS = ['Free', '$', '$$', '$$$', '$$$$'];

const CUISINE_OPTIONS = [
  { value: '', label: 'All Cuisines' },
  { value: 'italian', label: 'Italian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'indian', label: 'Indian' },
  { value: 'thai', label: 'Thai' },
  { value: 'french', label: 'French' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
];

export default function Filters({
  maxPrice,
  cuisineType,
  radius,
  onMaxPriceChange,
  onCuisineTypeChange,
  onRadiusChange,
}: FiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>

      {/* Max Price Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Price: {maxPrice !== null ? PRICE_LABELS[maxPrice] : 'Any'}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="4"
            value={maxPrice ?? 4}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onMaxPriceChange(value === 4 ? null : value);
            }}
            className="flex-1"
          />
          <button
            onClick={() => onMaxPriceChange(null)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Free</span>
          <span>$$$$</span>
        </div>
      </div>

      {/* Cuisine Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cuisine Type
        </label>
        <select
          value={cuisineType}
          onChange={(e) => onCuisineTypeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        >
          {CUISINE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Radius Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Radius: {(radius / 1609.34).toFixed(1)} miles
        </label>
        <input
          type="range"
          min="161" // 0.1 miles in meters
          max="1609" // 1 mile in meters
          step="161" // ~0.1 mile increments
          value={radius}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.1 mi</span>
          <span>1 mi</span>
        </div>
      </div>
    </div>
  );
}

