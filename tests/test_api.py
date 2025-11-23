import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.simulator import FactorySimulator

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert "version" in response.json()

def test_status_endpoint():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "machines" in data
    assert len(data["machines"]) > 0

def test_start_machine():
    response = client.get("/api/start/0")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_stop_machine():
    response = client.get("/api/stop/0")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_maintenance():
    response = client.get("/api/maintenance/0")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_invalid_machine_id():
    response = client.get("/api/start/999")
    assert response.status_code == 200
    assert response.json()["status"] == "error"
