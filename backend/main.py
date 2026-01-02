import os
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import googlemaps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Restaurant Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Maps client
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_PLACES_API_KEY environment variable is required")

gmaps = googlemaps.Client(key=GOOGLE_API_KEY)


# Response models
class Restaurant(BaseModel):
    place_id: str
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    rating: Optional[float] = None
    price_level: Optional[int] = None  # 0-4, where 0 is free and 4 is very expensive
    types: List[str] = []
    user_ratings_total: Optional[int] = None
    photos: Optional[List[str]] = None


class RestaurantDetail(BaseModel):
    place_id: str
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    rating: Optional[float] = None
    price_level: Optional[int] = None
    types: List[str] = []
    user_ratings_total: Optional[int] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None
    opening_hours: Optional[dict] = None
    menu_url: Optional[str] = None
    photos: Optional[List[str]] = None


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/restaurants", response_model=dict)
async def list_restaurants(
    lat: float = Query(..., description="Latitude of search center"),
    lng: float = Query(..., description="Longitude of search center"),
    radius: int = Query(5000, description="Search radius in meters (default: 5000m = ~3 miles)"),
    min_price: Optional[int] = Query(None, ge=0, le=4, description="Minimum price level (0-4)"),
    max_price: Optional[int] = Query(None, ge=0, le=4, description="Maximum price level (0-4)"),
    cuisine_type: Optional[str] = Query(None, description="Cuisine type filter (e.g., 'italian', 'chinese', 'mexican')"),
) -> dict:
    """
    Search for restaurants using Google Places API Nearby Search.
    
    Filters:
    - Cost: min_price and max_price (0-4 scale)
    - Distance: radius from lat/lng
    - Cuisine: cuisine_type keyword
    """
    try:
        # Build the search query
        location = (lat, lng)
        
        # Build the API request parameters
        request_params = {
            "location": location,
            "radius": radius,
            "type": "restaurant",
        }
        
        # Add keyword for cuisine filtering (Google Places API searches in name and other fields)
        if cuisine_type:
            request_params["keyword"] = cuisine_type
        
        # Google Places Nearby Search
        places_result = gmaps.places_nearby(**request_params)
        
        # Check API response status
        api_status = places_result.get("status")
        error_message = places_result.get("error_message")
        
        # Handle API errors
        if api_status not in ["OK", "ZERO_RESULTS"]:
            error_msg = error_message or f"Google Places API error: {api_status}"
            if api_status == "REQUEST_DENIED":
                error_msg += " - Check your API key and ensure Places API is enabled"
            elif api_status == "INVALID_REQUEST":
                error_msg += " - Check your request parameters"
            raise HTTPException(status_code=400, detail=error_msg)
        
        restaurants = []
        
        for place in places_result.get("results", []):
            # Extract price level if available
            price_level = place.get("price_level")
            
            # Apply price filter
            if min_price is not None and (price_level is None or price_level < min_price):
                continue
            if max_price is not None and (price_level is None or price_level > max_price):
                continue
            
            # Get photo reference for first photo if available
            photos = []
            if "photos" in place and len(place["photos"]) > 0:
                photo_ref = place["photos"][0].get("photo_reference")
                if photo_ref:
                    photos.append(photo_ref)
            
            restaurant = Restaurant(
                place_id=place.get("place_id"),
                name=place.get("name"),
                address=place.get("vicinity") or place.get("formatted_address"),
                lat=place["geometry"]["location"]["lat"],
                lng=place["geometry"]["location"]["lng"],
                rating=place.get("rating"),
                price_level=price_level,
                types=place.get("types", []),
                user_ratings_total=place.get("user_ratings_total"),
                photos=photos if photos else None,
            )
            restaurants.append(restaurant)
        
        return {
            "restaurants": [r.model_dump() for r in restaurants],
            "count": len(restaurants),
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching restaurants: {str(e)}")


@app.get("/restaurants/{place_id}", response_model=RestaurantDetail)
async def get_restaurant_details(place_id: str) -> RestaurantDetail:
    """
    Get detailed information about a specific restaurant, including menu data if available.
    """
    try:
        # Get place details
        place_details = gmaps.place(
            place_id=place_id,
            fields=[
                "name",
                "formatted_address",
                "geometry",
                "rating",
                "price_level",
                "types",
                "user_ratings_total",
                "formatted_phone_number",
                "website",
                "opening_hours",
                "photos",
            ],
        )
        
        result = place_details.get("result", {})
        
        # Get menu URL if available (might be in website or we can check for menu-related fields)
        menu_url = None
        if "website" in result:
            # Sometimes menu is on the website, but we'd need to check separately
            # For now, we'll return the website and can enhance later
            menu_url = result.get("website")
        
        # Get photo references
        photos = []
        if "photos" in result:
            photos = [photo.get("photo_reference") for photo in result["photos"][:5] if photo.get("photo_reference")]
        
        restaurant_detail = RestaurantDetail(
            place_id=place_id,
            name=result.get("name"),
            address=result.get("formatted_address"),
            lat=result["geometry"]["location"]["lat"],
            lng=result["geometry"]["location"]["lng"],
            rating=result.get("rating"),
            price_level=result.get("price_level"),
            types=result.get("types", []),
            user_ratings_total=result.get("user_ratings_total"),
            phone_number=result.get("formatted_phone_number"),
            website=result.get("website"),
            opening_hours=result.get("opening_hours"),
            menu_url=menu_url,
            photos=photos if photos else None,
        )
        
        return restaurant_detail
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching restaurant details: {str(e)}")



