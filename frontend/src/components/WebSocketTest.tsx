'use client';

import { useState } from 'react';

export function WebSocketTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState('ws://localhost:8001/ws');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testConnection = () => {
    addLog(`Testing connection to: ${wsUrl}`);
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        addLog('✅ WebSocket connected successfully');
        setIsConnected(true);
        ws.send('Test message from browser');
      };
      
      ws.onmessage = (event) => {
        addLog(`📨 Received: ${event.data}`);
      };
      
      ws.onerror = (error) => {
        addLog(`❌ WebSocket error: ${JSON.stringify(error)}`);
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        addLog('🔌 WebSocket connection closed');
        setIsConnected(false);
      };
      
      // Close connection after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }, 5000);
      
    } catch (error) {
      addLog(`❌ Connection error: ${error}`);
      setIsConnected(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">WebSocket Connection Test</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">WebSocket URL:</label>
        <input
          type="text"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="ws://localhost:8001/ws"
        />
      </div>
      
      <button
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Test Connection
      </button>
      
      <div className="mb-2">
        <span className="font-medium">Status: </span>
        <span className={isConnected ? "text-green-600" : "text-red-600"}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
      
      <div className="bg-gray-100 p-3 rounded h-64 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500">Click &quot;Test Connection&quot; to start testing...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  );
}
