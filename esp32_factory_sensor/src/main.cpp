#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// WebSocket server
const char* websocket_server = "YOUR_SERVER_IP";  // Change to your server IP
const int websocket_port = 8000;
const char* websocket_path = "/ws";

// Sensor pins
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Accelerometer pins (ADXL335)
const int xPin = 34;
const int yPin = 35;
const int zPin = 32;

WebSocketsClient webSocket;

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WSc] Disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("[WSc] Connected to server");
      break;
    case WStype_TEXT:
      Serial.printf("[WSc] Received: %s\n", payload);
      break;
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  dht.begin();
  pinMode(xPin, INPUT);
  pinMode(yPin, INPUT);
  pinMode(zPin, INPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Connect to WebSocket server
  webSocket.begin(websocket_server, websocket_port, websocket_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();
  
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 1000) { // Update every second
    lastUpdate = millis();
    
    // Read sensors
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    // Read accelerometer (vibration)
    int x = analogRead(xPin);
    int y = analogRead(yPin);
    int z = analogRead(zPin);
    float vibration = sqrt(x*x + y*y + z*z);
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["machine_id"] = 1;  // Change for each ESP32
    doc["temperature"] = temperature;
    doc["vibration"] = vibration;
    doc["humidity"] = humidity;
    doc["status"] = "running";
    
    // Send data
    String jsonString;
    serializeJson(doc, jsonString);
    webSocket.sendTXT(jsonString);
    
    // Debug output
    Serial.print("Sending: ");
    Serial.println(jsonString);
  }
}
