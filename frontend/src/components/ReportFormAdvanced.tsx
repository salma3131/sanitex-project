'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { GPSLocationTracker } from '@/components/GPSLocationTracker';

interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
  address: string;
}

export function ReportFormAdvanced() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [geoLocation, setGeoLocation] = useState<GeoLocation>({
    latitude: null,
    longitude: null,
    address: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const audioChunks = useRef<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  // Handle GPS location updates
  const handleLocationUpdate = useCallback((gpsLocation: any) => {
    if (gpsLocation.latitude && gpsLocation.longitude) {
      setGeoLocation(prev => {
        // Only update if location actually changed
        if (prev.latitude === gpsLocation.latitude && 
            prev.longitude === gpsLocation.longitude && 
            prev.address === (gpsLocation.address || '')) {
          return prev;
        }
        return {
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          address: gpsLocation.address || ''
        };
      });
      console.log('✓ GPS Location updated:', gpsLocation);
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      console.log('✓ Recording started');
    } catch (err) {
      setError('Unable to access microphone');
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.onstop = () => {
        const newAudioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioBlob(newAudioBlob);
        // In a real app, you'd send this audio blob to the backend for speech-to-text conversion
        console.log('✓ Recording stopped, audio blob created');
      };
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validate form
      if (!description.trim() && !selectedImage) {
        setError('Please provide a description or upload an image');
        setIsLoading(false);
        return;
      }

      if (!location.trim() && geoLocation.latitude === null) {
        setError('Please provide a location');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('description', description);
      formData.append('location', location);
      formData.append('latitude', geoLocation.latitude?.toString() || '');
      formData.append('longitude', geoLocation.longitude?.toString() || '');

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (audioBlob) {
        formData.append('audio', audioBlob, 'audio.wav');
      }

      const response = await fetch(`${API_URL}/api/reports/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        const errorData = await response.json();

        // If authentication failed, logout and redirect to login
        if (response.status === 401) {
          console.log('Authentication failed - logging out');
          logout();
          router.push('/login');
          return;
        }

        throw new Error(errorData.detail || 'Failed to submit report');
      }

      console.log('✓ Report submitted successfully:', data.report.id);
      setSuccess(`Report submitted successfully! ID: ${data.report.id}`);

      // Reset form
      setDescription('');
      setSelectedImage(null);
      setImagePreview('');
      setLocation('');

      // Redirect after success
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('✗ Report submission error:', errorMessage);
      
      // Handle authentication errors in catch block
      if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        console.log('Authentication failed - logging out');
        logout();
        router.push('/login');
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Professional Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m0 0l4 4m0 0l4-4-4m6 3l6 3m0-6l-3-3m6 3l-3-3"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Report Sanitation Issue</h1>
              <p className="text-gray-600">Help us keep the area clean and safe</p>
            </div>
          </div>
        </div>

        {/* Professional Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 0l6 6m-6 0l6 6M21 12a9 9 0 11-18 0 9 9v6a9 9 0 00-18 0z"/>
              </svg>
              Submit New Report
            </h2>
            <p className="text-blue-100 mt-2">Fill in the details below to report a sanitation issue</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7l-4 4m0 0l4-4-4-4M6 16l-4 4m0 0l4-4-4-4"/>
                  </svg>
                </div>
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Location
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or area name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {geoLocation.latitude && geoLocation.longitude && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span className="font-semibold text-blue-800">GPS Coordinates:</span>
                      </div>
                      <p className="font-mono text-xs bg-white p-2 rounded border border-blue-300">
                        {geoLocation.latitude.toFixed(6)}, {geoLocation.longitude.toFixed(6)}
                      </p>
                      {geoLocation.address && (
                        <p className="text-xs mt-2 text-gray-600 bg-white p-2 rounded border border-blue-300">
                          {geoLocation.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Location Tracker */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <GPSLocationTracker 
                  onLocationUpdate={handleLocationUpdate}
          showControls={true}
                  className="mb-6"
                />
              </div>

              {/* Description Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the sanitation issue in detail... (e.g., 'Garbage pile in the park', 'Blocked drain', etc.)"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Upload Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
            <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-input"
                    disabled={isLoading}
                  />
                  <label htmlFor="image-input" className="cursor-pointer block">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover rounded-lg" />
                        <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                          }}
                          className="text-sm text-red-600 hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              )}
            </label>
          </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg transform hover:scale-105 duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m0 0l4 4m0 0l4-4-4m6 3l6 3m0-6l-3-3m6 3l-3-3"/>
                    </svg>
                    Submit Report
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6 bg-gray-50 p-3 rounded-lg">
              Your report will be analyzed by our AI system and forwarded to the appropriate authorities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
