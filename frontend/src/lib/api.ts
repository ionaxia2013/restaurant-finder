/**
 * API client for communicating with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface Restaurant {
  place_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  price_level: number | null; // 0-4
  types: string[];
  user_ratings_total: number | null;
  photos: string[] | null;
}

export interface RestaurantDetail extends Restaurant {
  phone_number: string | null;
  website: string | null;
  opening_hours: any | null;
  menu_url: string | null;
}

export interface RestaurantSearchParams {
  lat: number;
  lng: number;
  radius?: number;
  min_price?: number;
  max_price?: number;
  cuisine_type?: string;
}

export interface RestaurantSearchResponse {
  restaurants: Restaurant[];
  count: number;
}

/**
 * Search for restaurants
 */
export async function searchRestaurants(
  params: RestaurantSearchParams
): Promise<RestaurantSearchResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set('lat', params.lat.toString());
  queryParams.set('lng', params.lng.toString());
  
  if (params.radius) {
    queryParams.set('radius', params.radius.toString());
  }
  if (params.min_price !== undefined) {
    queryParams.set('min_price', params.min_price.toString());
  }
  if (params.max_price !== undefined) {
    queryParams.set('max_price', params.max_price.toString());
  }
  if (params.cuisine_type) {
    queryParams.set('cuisine_type', params.cuisine_type);
  }

  const response = await fetch(`${API_BASE_URL}/restaurants?${queryParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch restaurants' }));
    throw new Error(error.detail || 'Failed to fetch restaurants');
  }

  return response.json();
}

/**
 * Get detailed information about a restaurant
 */
export async function getRestaurantDetails(placeId: string): Promise<RestaurantDetail> {
  const response = await fetch(`${API_BASE_URL}/restaurants/${placeId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch restaurant details' }));
    throw new Error(error.detail || 'Failed to fetch restaurant details');
  }

  return response.json();
}

