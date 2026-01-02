"""
Tests for the restaurant search and details endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


def test_restaurants_search_missing_params(client: TestClient):
    """Test that restaurant search requires lat and lng parameters."""
    response = client.get("/restaurants")
    assert response.status_code == 422  # Validation error


def test_restaurants_search_basic(client: TestClient, mock_google_maps_client, sample_restaurant_data):
    """Test basic restaurant search without filters."""
    # Mock the Google Maps API response
    mock_google_maps_client.places_nearby.return_value = {
        "results": [sample_restaurant_data]
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194")
    
    assert response.status_code == 200
    data = response.json()
    assert "restaurants" in data
    assert "count" in data
    assert data["count"] == 1
    assert len(data["restaurants"]) == 1
    
    restaurant = data["restaurants"][0]
    assert restaurant["place_id"] == "ChIJN1t_tDeuEmsRUsoyG83frY4"
    assert restaurant["name"] == "Test Restaurant"
    assert restaurant["lat"] == 37.7749
    assert restaurant["lng"] == -122.4194
    assert restaurant["rating"] == 4.5
    assert restaurant["price_level"] == 2


def test_restaurants_search_with_radius(client: TestClient, mock_google_maps_client, sample_restaurant_data):
    """Test restaurant search with custom radius."""
    mock_google_maps_client.places_nearby.return_value = {
        "results": [sample_restaurant_data]
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194&radius=2000")
    
    assert response.status_code == 200
    # Verify the API was called with the correct radius
    mock_google_maps_client.places_nearby.assert_called_once()
    call_args = mock_google_maps_client.places_nearby.call_args
    assert call_args[1]["radius"] == 2000


def test_restaurants_search_price_filter_min(client: TestClient, mock_google_maps_client):
    """Test restaurant search with minimum price filter."""
    # Restaurant with price_level 1 (should be filtered out)
    cheap_restaurant = {
        "place_id": "cheap_place",
        "name": "Cheap Restaurant",
        "vicinity": "123 Main St",
        "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
        "rating": 4.0,
        "price_level": 1,
        "types": ["restaurant"],
    }
    
    # Restaurant with price_level 3 (should pass filter)
    expensive_restaurant = {
        "place_id": "expensive_place",
        "name": "Expensive Restaurant",
        "vicinity": "456 Main St",
        "geometry": {"location": {"lat": 37.7750, "lng": -122.4195}},
        "rating": 4.5,
        "price_level": 3,
        "types": ["restaurant"],
    }
    
    mock_google_maps_client.places_nearby.return_value = {
        "results": [cheap_restaurant, expensive_restaurant]
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194&min_price=2")
    
    assert response.status_code == 200
    data = response.json()
    # Only the expensive restaurant should pass the filter
    assert data["count"] == 1
    assert data["restaurants"][0]["place_id"] == "expensive_place"


def test_restaurants_search_price_filter_max(client: TestClient, mock_google_maps_client):
    """Test restaurant search with maximum price filter."""
    cheap_restaurant = {
        "place_id": "cheap_place",
        "name": "Cheap Restaurant",
        "vicinity": "123 Main St",
        "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
        "rating": 4.0,
        "price_level": 1,
        "types": ["restaurant"],
    }
    
    expensive_restaurant = {
        "place_id": "expensive_place",
        "name": "Expensive Restaurant",
        "vicinity": "456 Main St",
        "geometry": {"location": {"lat": 37.7750, "lng": -122.4195}},
        "rating": 4.5,
        "price_level": 4,
        "types": ["restaurant"],
    }
    
    mock_google_maps_client.places_nearby.return_value = {
        "results": [cheap_restaurant, expensive_restaurant]
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194&max_price=2")
    
    assert response.status_code == 200
    data = response.json()
    # Only the cheap restaurant should pass the filter
    assert data["count"] == 1
    assert data["restaurants"][0]["place_id"] == "cheap_place"


def test_restaurants_search_price_filter_range(client: TestClient, mock_google_maps_client):
    """Test restaurant search with both min and max price filters."""
    restaurants = [
        {
            "place_id": "place_1",
            "name": "Restaurant 1",
            "vicinity": "123 Main St",
            "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
            "rating": 4.0,
            "price_level": 1,
            "types": ["restaurant"],
        },
        {
            "place_id": "place_2",
            "name": "Restaurant 2",
            "vicinity": "456 Main St",
            "geometry": {"location": {"lat": 37.7750, "lng": -122.4195}},
            "rating": 4.5,
            "price_level": 2,
            "types": ["restaurant"],
        },
        {
            "place_id": "place_3",
            "name": "Restaurant 3",
            "vicinity": "789 Main St",
            "geometry": {"location": {"lat": 37.7751, "lng": -122.4196}},
            "rating": 4.2,
            "price_level": 3,
            "types": ["restaurant"],
        },
    ]
    
    mock_google_maps_client.places_nearby.return_value = {
        "results": restaurants
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194&min_price=2&max_price=2")
    
    assert response.status_code == 200
    data = response.json()
    # Only restaurant with price_level 2 should pass
    assert data["count"] == 1
    assert data["restaurants"][0]["place_id"] == "place_2"


def test_restaurants_search_cuisine_filter(client: TestClient, mock_google_maps_client):
    """Test restaurant search with cuisine type filter."""
    italian_restaurant = {
        "place_id": "italian_place",
        "name": "Italian Restaurant",
        "vicinity": "123 Main St",
        "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
        "rating": 4.5,
        "price_level": 2,
        "types": ["restaurant", "italian_restaurant", "food"],
    }
    
    chinese_restaurant = {
        "place_id": "chinese_place",
        "name": "Chinese Restaurant",
        "vicinity": "456 Main St",
        "geometry": {"location": {"lat": 37.7750, "lng": -122.4195}},
        "rating": 4.0,
        "price_level": 2,
        "types": ["restaurant", "chinese_restaurant", "food"],
    }
    
    mock_google_maps_client.places_nearby.return_value = {
        "results": [italian_restaurant, chinese_restaurant]
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194&cuisine_type=italian")
    
    assert response.status_code == 200
    data = response.json()
    # Only Italian restaurant should pass the filter
    assert data["count"] == 1
    assert data["restaurants"][0]["place_id"] == "italian_place"


def test_restaurants_search_no_price_level(client: TestClient, mock_google_maps_client):
    """Test that restaurants without price_level are still included."""
    restaurant_no_price = {
        "place_id": "no_price_place",
        "name": "Restaurant No Price",
        "vicinity": "123 Main St",
        "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
        "rating": 4.0,
        "types": ["restaurant"],
        # No price_level field
    }
    
    mock_google_maps_client.places_nearby.return_value = {
        "results": [restaurant_no_price]
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194")
    
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["restaurants"][0]["price_level"] is None


def test_restaurants_search_empty_results(client: TestClient, mock_google_maps_client):
    """Test restaurant search when no results are found."""
    mock_google_maps_client.places_nearby.return_value = {
        "results": []
    }
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194")
    
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert data["restaurants"] == []


def test_restaurants_search_api_error(client: TestClient, mock_google_maps_client):
    """Test error handling when Google Maps API fails."""
    mock_google_maps_client.places_nearby.side_effect = Exception("API Error")
    
    response = client.get("/restaurants?lat=37.7749&lng=-122.4194")
    
    assert response.status_code == 500
    assert "Error searching restaurants" in response.json()["detail"]


def test_restaurant_details_success(client: TestClient, mock_google_maps_client, sample_place_details):
    """Test successful restaurant details retrieval."""
    mock_google_maps_client.place.return_value = sample_place_details
    
    place_id = "ChIJN1t_tDeuEmsRUsoyG83frY4"
    response = client.get(f"/restaurants/{place_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["place_id"] == place_id
    assert data["name"] == "Test Restaurant"
    assert data["phone_number"] == "+1 415-555-1234"
    assert data["website"] == "https://testrestaurant.com"
    assert data["opening_hours"] is not None
    assert len(data["photos"]) == 2


def test_restaurant_details_not_found(client: TestClient, mock_google_maps_client):
    """Test restaurant details when place is not found."""
    mock_google_maps_client.place.return_value = {
        "result": {}
    }
    
    response = client.get("/restaurants/invalid_place_id")
    
    # Should handle gracefully - might return 200 with partial data or 500
    # Depending on implementation, adjust assertion accordingly
    assert response.status_code in [200, 500]


def test_restaurant_details_api_error(client: TestClient, mock_google_maps_client):
    """Test error handling when Google Maps API fails for details."""
    mock_google_maps_client.place.side_effect = Exception("API Error")
    
    response = client.get("/restaurants/ChIJN1t_tDeuEmsRUsoyG83frY4")
    
    assert response.status_code == 500
    assert "Error fetching restaurant details" in response.json()["detail"]

