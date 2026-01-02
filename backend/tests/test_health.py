"""
Tests for the health check endpoint.
"""
import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Test that the health endpoint returns OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

