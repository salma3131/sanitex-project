'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WebSocketTest } from '@/components/WebSocketTest';

export default function DebugPage() {
  const { user, token } = useAuth();
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const testEndpoint = async (endpoint: string, requiresAuth: boolean = false) => {
    setLoading(true);
    try {
      const headers: any = {};
      if (requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, { headers });
      const data = await response.json();
      
      setResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          success: response.ok,
          data: data,
          error: null
        }
      }));
    } catch (error) {
      setResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          status: 'ERROR',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
    setLoading(false);
  };

  const runAllTests = () => {
    testEndpoint('/api/test', false);
    testEndpoint('/api/test/auth', true);
    testEndpoint('/api/test/admin', true);
    testEndpoint('/api/admin/reports', true);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API Debug Page</h1>
        
        {/* User Info */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">User Info</h2>
          <div className="text-gray-300">
            <p><strong>User:</strong> {user ? JSON.stringify(user) : 'Not logged in'}</p>
            <p><strong>Token:</strong> {token ? 'Available' : 'Not available'}</p>
            <p><strong>Role:</strong> {user?.role || 'Unknown'}</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">API Tests</h2>
          <div className="space-x-4">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Run All Tests'}
            </button>
            <button
              onClick={() => testEndpoint('/api/test', false)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Test Basic
            </button>
            <button
              onClick={() => testEndpoint('/api/test/auth', true)}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              Test Auth
            </button>
            <button
              onClick={() => testEndpoint('/api/test/admin', true)}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Test Admin
            </button>
            <button
              onClick={() => testEndpoint('/api/admin/reports', true)}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Test Reports
            </button>
          </div>
        </div>

        {/* WebSocket Test */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">WebSocket Connection Test</h2>
          <WebSocketTest />
        </div>

        {/* Results */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
          <div className="space-y-4">
            {Object.entries(results).map(([endpoint, result]: [string, any]) => (
              <div key={endpoint} className="bg-gray-800 rounded p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{endpoint}</h3>
                <div className="text-sm">
                  <p className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    Status: {result.status}
                  </p>
                  {result.error && (
                    <p className="text-red-400 mt-1">Error: {result.error}</p>
                  )}
                  {result.data && (
                    <div className="mt-2">
                      <p className="text-gray-300">Response:</p>
                      <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
