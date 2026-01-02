"""
Pytest configuration and shared fixtures for testing.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Set a dummy API key for testing
os.environ["GOOGLE_PLACES_API_KEY"] = "test_api_key_12345"

# Create a module-level mock that will be reused
_mock_gmaps = MagicMock()

# Patch googlemaps.Client at module level so main.gmaps uses the mock when created
_googlemaps_patcher = patch("googlemaps.Client", return_value=_mock_gmaps)
_googlemaps_patcher.start()


@pytest.fixture
def mock_google_maps_client():
    """Mock Google Maps client for testing."""
    # Reset mock before each test
    _mock_gmaps.reset_mock()
    yield _mock_gmaps


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    # Reload main module to ensure it uses the mocked Client
    if "main" in sys.modules:
        del sys.modules["main"]
    from main import app
    # Ensure gmaps is our mock (should be from the patched Client)
    import main
    main.gmaps = _mock_gmaps
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Create an async test client for the FastAPI app."""
    if "main" in sys.modules:
        del sys.modules["main"]
    from main import app
    import main
    main.gmaps = _mock_gmaps
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_restaurant_data():
    """Sample restaurant data for testing."""
    return {
        "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "name": "Test Restaurant",
        "vicinity": "123 Main St, San Francisco, CA",
        "geometry": {
            "location": {
                "lat": 37.7749,
                "lng": -122.4194
            }
        },
        "rating": 4.5,
        "price_level": 2,
        "types": ["restaurant", "food", "point_of_interest", "establishment"],
        "user_ratings_total": 150,
        "photos": [
            {
                "photo_reference": "test_photo_ref_123"
            }
        ]
    }


@pytest.fixture
def sample_place_details():
    """Sample place details data for testing."""
    return {
        "result": {
            "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
            "name": "Test Restaurant",
            "formatted_address": "123 Main St, San Francisco, CA 94102",
            "geometry": {
                "location": {
                    "lat": 37.7749,
                    "lng": -122.4194
                }
            },
            "rating": 4.5,
            "price_level": 2,
            "types": ["restaurant", "food", "point_of_interest", "establishment"],
            "user_ratings_total": 150,
            "formatted_phone_number": "+1 415-555-1234",
            "website": "https://testrestaurant.com",
            "opening_hours": {
                "open_now": True,
                "weekday_text": [
                    "Monday: 11:00 AM – 10:00 PM",
                    "Tuesday: 11:00 AM – 10:00 PM"
                ]
            },
            "photos": [
                {"photo_reference": "test_photo_ref_1"},
                {"photo_reference": "test_photo_ref_2"}
            ]
        }
    }

