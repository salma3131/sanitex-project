'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Location {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  address?: string;
}

interface LocationError {
  code: number;
  message: string;
}

interface UseGPSLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export function useGPSLocation(options: UseGPSLocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watchPosition = true
  } = options;

  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    address: ''
  });

  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  
  const watchIdRef = useRef<number | null>(null);

  // Check location permission status
  const checkPermissionStatus = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state as 'prompt' | 'granted' | 'denied');
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state as 'prompt' | 'granted' | 'denied');
        });
      } catch (err) {
        console.error('Error checking permission status:', err);
        setPermissionStatus('unknown');
      }
    }
  }, []);

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (err) {
      console.error('Error getting address:', err);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Handle location success
  const handleLocationSuccess = useCallback(async (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    
    const newLocation: Location = {
      latitude,
      longitude,
      accuracy,
      timestamp: position.timestamp
    };

    // Get address from coordinates
    try {
      const address = await getAddressFromCoordinates(latitude, longitude);
      newLocation.address = address;
    } catch (err) {
      console.error('Error getting address:', err);
    }

    setLocation(newLocation);
    setError(null);
    setIsLoading(false);
    setIsTracking(true);
    
    console.log('✓ GPS Location updated:', {
      latitude,
      longitude,
      accuracy,
      address: newLocation.address
    });
  }, [getAddressFromCoordinates]);

  // Handle location error
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    const locationError: LocationError = {
      code: error.code,
      message: error.message
    };

    setError(locationError);
    setIsLoading(false);
    setIsTracking(false);
    
    console.error('✗ GPS Location error:', locationError);
  }, []);

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported by your browser' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Check permission first
    await checkPermissionStatus();

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    if (watchPosition) {
      // Start watching position for continuous updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        positionOptions
      );
    } else {
      // Get current position once
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        positionOptions
      );
    }
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, handleLocationSuccess, handleLocationError, checkPermissionStatus]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      console.log('✓ GPS Location tracking stopped');
    }
  }, []);

  // Request location permission
  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported by your browser' });
      return false;
    }

    try {
      // This will trigger the permission prompt
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      await checkPermissionStatus();
      return true;
    } catch (err) {
      console.error('Permission request failed:', err);
      return false;
    }
  }, [checkPermissionStatus]);

  // Initialize on mount
  useEffect(() => {
    const initialize = () => {
      checkPermissionStatus();
    };
    initialize();
    
    return () => {
      stopTracking();
    };
  }, [checkPermissionStatus, stopTracking]);

  // Auto-start tracking if permission is granted
  useEffect(() => {
    if (permissionStatus === 'granted' && !isTracking) {
      const start = () => {
        startTracking();
      };
      start();
    }
  }, [permissionStatus, isTracking, startTracking]);

  return {
    location,
    error,
    isLoading,
    isTracking,
    permissionStatus,
    startTracking,
    stopTracking,
    requestPermission
  };
}
