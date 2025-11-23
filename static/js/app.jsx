const { useState, useEffect, useCallback, useMemo, memo } = React;

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) { 
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'Unknown error occurred'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Memoized Machine Card Component
const MachineCard = memo(({ machine }) => {
  if (!machine) return null;
  
  const statusColor = {
    running: 'text-green-600',
    idle: 'text-yellow-600',
    error: 'text-red-600'
  }[machine.status] || 'text-gray-600';

  const healthColor = machine.health > 70 ? 'text-green-600' : 
                     machine.health > 30 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Machine {machine.id}</h2>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} bg-${statusColor.replace('text-', 'bg-')} bg-opacity-20`}>
          {machine.status.toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Health</span>
            <span className={`font-medium ${healthColor}`}>{machine.health.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${healthColor.replace('text-', 'bg-')}`}
              style={{ width: `${machine.health}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-sm text-gray-500">Temperature</p>
            <p className="font-medium">
              {machine.temperature.toFixed(1)}°C
              {machine.temperature > 35 && <span className="text-red-500 ml-1">↑</span>}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vibration</p>
            <p className="font-medium">
              {machine.vibration.toFixed(3)}g
              {machine.vibration > 0.3 && <span className="text-yellow-600 ml-1">⚠️</span>}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm text-gray-500">Uptime</p>
          <p className="text-sm font-medium">
            {Math.floor(machine.operating_hours)}h {Math.floor((machine.operating_hours % 1) * 60)}m
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-2">
        <button 
          onClick={() => fetch(`/api/start/${machine.id}`)}
          disabled={machine.status === 'running'}
          className={`px-3 py-1 text-xs rounded ${
            machine.status === 'running' 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Start
        </button>
        <button 
          onClick={() => fetch(`/api/stop/${machine.id}`)}
          disabled={machine.status !== 'running'}
          className={`px-3 py-1 text-xs rounded ${
            machine.status !== 'running' 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          Stop
        </button>
        <button 
          onClick={() => fetch(`/api/maintenance/${machine.id}`)}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ml-auto"
        >
          Maintenance
        </button>
      </div>
    </div>
  );
});

// Main App Component
function App() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket connection with reconnection
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    let reconnectAttempts = 0;
    let reconnectTimeout;

    const scheduleReconnect = () => {
      if (reconnectAttempts < 5) {
        reconnectTimeout = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts + 1}/5)...`);
          connectWebSocket();
          reconnectAttempts++;
        }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)); // Exponential backoff, max 30s
      } else {
        setError('Unable to connect to server. Please refresh the page to try again.');
      }
    };

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setError(null);
      reconnectAttempts = 0;
      setIsLoading(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Error processing data from server');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (!isConnected) {
        setError('Connecting to server...');
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket Disconnected:', event.code, event.reason);
      setIsConnected(false);
      if (event.code !== 1000) { // Don't reconnect if closed normally
        scheduleReconnect();
      }
    };

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connecting to Factory</h2>
          <p className="text-gray-600">Initializing real-time monitoring...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Connection Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Factory Dashboard</h1>
              <p className="text-sm text-gray-500">
                Real-time monitoring and control
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {lastUpdate && (
                <div className="text-sm text-gray-500 hidden sm:block">
                  Last update: {lastUpdate}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {status ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {status.machines.map((machine) => (
                  <MachineCard key={machine.id} machine={machine} />
                ))}
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Machines</p>
                    <p className="text-2xl font-bold">{status.machines.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Running</p>
                    <p className="text-2xl font-bold text-green-600">
                      {status.machines.filter(m => m.status === 'running').length}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Needs Attention</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {status.machines.filter(m => m.health < 70).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading machine data...</p>
            </div>
          )}
        </main>

        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Smart Factory Simulator. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
