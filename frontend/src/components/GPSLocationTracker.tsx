'use client';

import { useEffect } from 'react';
import { useGPSLocation } from '@/hooks/useGPSLocation';

interface GPSLocationTrackerProps {
  onLocationUpdate?: (location: any) => void;
  showControls?: boolean;
  className?: string;
}

export function GPSLocationTracker({ 
  onLocationUpdate, 
  showControls = true, 
  className = '' 
}: GPSLocationTrackerProps) {
  const {
    location,
    error,
    isLoading,
    isTracking,
    permissionStatus,
    startTracking,
    stopTracking,
    requestPermission
  } = useGPSLocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    watchPosition: true
  });

  // Notify parent component when location updates
  useEffect(() => {
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  }, [location, onLocationUpdate]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      startTracking();
    }
  };

  const getPermissionMessage = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Location access granted';
      case 'denied':
        return 'Location access denied';
      case 'prompt':
        return 'Location permission required';
      default:
        return 'Checking location permission...';
    }
  };

  const getPermissionColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'denied':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'prompt':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Live GPS Location
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPermissionColor()}`}>
          {getPermissionMessage()}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isTracking ? 'Tracking location...' : 'Location tracking inactive'}
          </span>
        </div>
      </div>

      {/* Location Information */}
      {location && location.latitude && location.longitude && (
        <div className="space-y-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Current Location
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
              <div><strong>Accuracy:</strong> {location.accuracy ? `±${Math.round(location.accuracy)}m` : 'Unknown'}</div>
              {location.address && (
                <div><strong>Address:</strong> {location.address}</div>
              )}
              <div><strong>Last Update:</strong> {location.timestamp ? new Date(location.timestamp).toLocaleTimeString() : 'Unknown'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <div className="text-sm font-medium text-red-800">Location Error</div>
              <div className="text-xs text-red-600 mt-1">{error.message}</div>
              {error.code === 1 && (
                <div className="text-xs text-red-600 mt-1">
                  Please enable location access in your browser settings and try again.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-600">Getting location...</span>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {showControls && (
        <div className="flex gap-2">
          {permissionStatus === 'denied' ? (
            <button
              onClick={() => window.open('chrome://settings/content/location', '_blank')}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
            >
              Open Settings
            </button>
          ) : permissionStatus === 'prompt' || permissionStatus === 'unknown' ? (
            <button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {isLoading ? 'Requesting...' : 'Enable Location'}
            </button>
          ) : (
            <>
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {isLoading ? 'Starting...' : 'Start Tracking'}
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Stop Tracking
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Instructions */}
      {permissionStatus !== 'granted' && (
        <div className="mt-3 text-xs text-gray-500">
          <div className="font-medium mb-1">Why location access is needed:</div>
          <ul className="space-y-1">
            <li>• Automatically detect your current location</li>
            <li>• Provide accurate location for sanitation reports</li>
            <li>• Enable real-time location tracking</li>
          </ul>
        </div>
      )}
    </div>
  );
}
