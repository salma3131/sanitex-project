'use client';

import { useGPSLocation } from '@/hooks/useGPSLocation';

interface GPSLocationIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function GPSLocationIndicator({ 
  className = '', 
  showDetails = false 
}: GPSLocationIndicatorProps) {
  const {
    location,
    error,
    isLoading,
    isTracking,
    permissionStatus
  } = useGPSLocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    watchPosition: true
  });

  const getStatusColor = () => {
    if (error) return 'text-red-600 bg-red-50 border-red-200';
    if (isTracking) return 'text-green-600 bg-green-50 border-green-200';
    if (isLoading) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (permissionStatus === 'denied') return 'text-red-600 bg-red-50 border-red-200';
    if (permissionStatus === 'prompt') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = () => {
    if (error) return 'Location Error';
    if (isTracking) return 'Tracking';
    if (isLoading) return 'Getting Location';
    if (permissionStatus === 'denied') return 'Location Denied';
    if (permissionStatus === 'prompt') return 'Enable Location';
    return 'Location Inactive';
  };

  const getStatusIcon = () => {
    if (error) return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    );
    if (isTracking) return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    );
    if (isLoading) return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l4 4m0 0l-4-4m4 4l-4-4"/>
      </svg>
    );
    if (permissionStatus === 'denied') return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
      </svg>
    );
    if (permissionStatus === 'prompt') return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    );
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    );
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor()} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      <span className="flex items-center gap-1">
        {getStatusIcon()}
        {getStatusText()}
      </span>
      
      {showDetails && location && location.latitude && location.longitude && (
        <div className="ml-2 text-xs">
          <span className="opacity-75">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
