# Smart Factory Simulator

A real-time IoT factory monitoring system with virtual machine simulation, ESP32 sensor integration, and predictive maintenance capabilities.

## 🎯 Features

- **Real-time Monitoring**: WebSocket-based live data streaming
- **Virtual Machine Simulation**: Simulates 5 factory machines with health degradation
- **Physical Sensor Integration**: ESP32 support with DHT22 (temperature/humidity) and ADXL335 (vibration) sensors
- **Predictive Maintenance**: Health tracking and failure prediction
- **RESTful API**: Machine control endpoints (start/stop/maintenance)
- **Interactive Dashboard**: Real-time React-based web interface

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [ESP32 Setup](#esp32-setup)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## 🏗️ System Architecture

```
┌─────────────────────┐
│   React Dashboard   │  ← Real-time UI updates via WebSocket
└──────────┬──────────┘
           │
    ┌──────▼──────────┐
    │  FastAPI Server │  ← Python backend with WebSocket support
    └──────┬──────────┘
           │
      ┌────▼────┐
      │Simulator│  ← Virtual machine simulation engine
      └────┬────┘
           │
    ┌──────▼────────┐
    │  ESP32 Nodes  │  ← Physical sensors (DHT22 + ADXL335)
    └───────────────┘
```

## 📦 Prerequisites

### Software Requirements
- **Python**: 3.9 or higher
- **Node.js**: Not required (React is loaded via CDN)
- **PlatformIO**: For ESP32 programming (optional)
- **Git**: For version control

### Hardware Requirements (Optional - for physical sensors)
- ESP32 Development Board
- DHT22 Temperature/Humidity Sensor
- ADXL335 Accelerometer
- Jumper wires and breadboard

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-factory-simulator
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Setup
Create a `.env` file in the project root:
```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Settings
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

# Redis Configuration (if needed)
REDIS_URL=redis://localhost:6379/0
```

## ⚙️ Configuration

### Application Settings
Edit `config/settings.py` to customize:
- Server host and port
- CORS origins
- Redis connection
- Application metadata

### Simulator Settings
Edit `app/simulator.py` to adjust:
- Number of machines (`num_machines=5`)
- Health degradation rates
- Temperature/vibration ranges
- Update intervals

## 🏃 Running the Application

### Start the Server
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run the application
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Access the Dashboard
Open your browser and navigate to:
```
http://localhost:8000
```

The dashboard will automatically connect to the WebSocket and start receiving real-time updates.

## 🔌 ESP32 Setup

### Hardware Connections

#### DHT22 (Temperature/Humidity)
```
DHT22 Pin    →  ESP32 Pin
VCC          →  3.3V
DATA         →  GPIO4
GND          →  GND
```

#### ADXL335 (Accelerometer)
```
ADXL335 Pin  →  ESP32 Pin
VCC          →  3.3V
X_OUT        →  GPIO34
Y_OUT        →  GPIO35
Z_OUT        →  GPIO32
GND          →  GND
```

### Software Setup

1. **Install PlatformIO**
   ```bash
   pip install platformio
   ```

2. **Navigate to ESP32 project**
   ```bash
   cd esp32_factory_sensor
   ```

3. **Update Configuration**
   Edit `src/main.cpp` and update:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* websocket_server = "YOUR_SERVER_IP";  // e.g., "192.168.1.100"
   ```

4. **Build and Upload**
   ```bash
   # Build the project
   pio run

   # Upload to ESP32 (connect via USB)
   pio run --target upload

   # Monitor serial output
   pio device monitor
   ```

### Multiple ESP32 Nodes
To run multiple sensors:
1. Change `machine_id` in `src/main.cpp` for each ESP32
2. Flash different boards with unique IDs
3. All will connect to the same WebSocket server

## 🔗 API Endpoints

### REST API

#### Start Machine
```http
GET /api/start/{machine_id}
```
**Response:**
```json
{
  "status": "success"
}
```

#### Stop Machine
```http
GET /api/stop/{machine_id}
```
**Response:**
```json
{
  "status": "success"
}
```

#### Perform Maintenance
```http
GET /api/maintenance/{machine_id}
```
**Response:**
```json
{
  "status": "success"
}
```

### WebSocket API

#### Connect to WebSocket
```
ws://localhost:8000/ws
```

#### Message Format
```json
{
  "timestamp": "2024-11-15T10:30:00.000000",
  "machines": [
    {
      "id": 0,
      "type": "CNC",
      "status": "running",
      "health": 95.5,
      "temperature": 32.1,
      "vibration": 0.23,
      "operating_hours": 120.5,
      "last_maintenance": "2024-11-15T08:00:00.000000"
    }
  ]
}
```

## 📁 Project Structure

```
smart-factory-simulator/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   └── simulator.py         # Virtual machine simulation logic
├── config/
│   ├── __init__.py
│   ├── settings.py          # Configuration management
│   └── logging.py           # Logging configuration
├── esp32_factory_sensor/
│   ├── platformio.ini       # PlatformIO configuration
│   └── src/
│       └── main.cpp         # ESP32 firmware
├── static/
│   ├── index.html           # Frontend HTML
│   └── js/
│       └── app.jsx          # React dashboard component
├── tests/
│   ├── test_api.py          # API endpoint tests
│   └── test_simulator.py   # Simulator unit tests
├── .env                     # Environment variables (create this)
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_simulator.py

# Run with verbose output
pytest -v
```

### Test WebSocket Connection
```bash
# Using wscat (install: npm install -g wscat)
wscat -c ws://localhost:8000/ws
```

## 💻 Development

### Adding New Sensors
1. Update `VirtualMachine` class in `app/simulator.py`
2. Add new sensor properties and update logic
3. Modify frontend in `static/js/app.jsx` to display new metrics

### Customizing Dashboard
Edit `static/js/app.jsx`:
```jsx
// Add new metrics, charts, or controls
// Uses React, TailwindCSS for styling
```

### Adding New API Endpoints
Edit `app/main.py`:
```python
@app.get("/api/your-endpoint")
def your_endpoint():
    # Your logic here
    return {"status": "success"}
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=True
python -m app.main
```

## 🔧 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed
**Problem:** Dashboard shows "Connecting to factory..."
**Solution:**
- Ensure backend is running: `http://localhost:8000`
- Check browser console for errors
- Verify firewall settings

#### 2. ESP32 Not Connecting
**Problem:** ESP32 can't connect to WiFi/WebSocket
**Solution:**
- Verify WiFi credentials in `main.cpp`
- Check server IP address (use your machine's local IP, not localhost)
- Ensure both devices are on the same network
- Check serial monitor for error messages: `pio device monitor`

#### 3. Import Errors
**Problem:** `ModuleNotFoundError`
**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Or install specific package
pip install fastapi uvicorn websockets
```

#### 4. Port Already in Use
**Problem:** `Address already in use`
**Solution:**
```bash
# Find process using port 8000
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Kill the process or change port in .env
PORT=8001
```

### Getting Help
- Check the logs in the terminal
- Review browser console (F12) for frontend errors
- Verify all dependencies are installed
- Ensure Python 3.9+ is being used

## 📊 Monitoring & Metrics

### Key Metrics Tracked
- **Machine Health**: 0-100% scale
- **Temperature**: Celsius (°C)
- **Vibration**: G-force magnitude
- **Operating Hours**: Cumulative runtime
- **Status**: idle, running, error

### Health Degradation Model
```python
# Health decreases based on:
- Operating time
- Random wear and tear
- Temperature deviation from optimal
- Vibration levels
```

## 🚀 Future Enhancements

- [ ] Historical data storage (database integration)
- [ ] Predictive analytics with machine learning
- [ ] Alert notifications (email/SMS)
- [ ] Multi-factory support
- [ ] User authentication
- [ ] Data export (CSV/Excel)
- [ ] Mobile app support
- [ ] Advanced charting with historical trends

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Indra Reddy - Initial Development

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- ESP32 community for hardware support
- React for the frontend library

---

**Last Updated:** November 15, 2024  
**Version:** 1.0.0
