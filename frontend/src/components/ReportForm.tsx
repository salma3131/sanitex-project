'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceData {
  original_text: string;
  detected_language: string;
  translated_text: string;
}

interface ReportData {
  id: string;
  location: string;
  description: string;
  severity: string;
  estimated_time: string;
  analysis: string;
  status: string;
  timestamp: string;
  original_text?: string;
  detected_language?: string;
  input_method?: string;
}

export default function ReportForm() {
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<ReportData | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // GPS Location State
  const [gpsLocation, setGpsLocation] = useState<{latitude: number | null, longitude: number | null, address: string}>({
    latitude: null,
    longitude: null,
    address: ''
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        setRecordingState('processing');
        setIsProcessing(true);
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.wav');
          
          const API_URL = 'http://localhost:8001';
          const response = await fetch(`${API_URL}/api/voice/process`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Voice processing failed');
          }
          
          const result = await response.json();
          setVoiceData(result);
          setDescription(result.translated_text);
          setRecordingState('idle');
          setIsProcessing(false);
        } catch (error) {
          console.error('Voice processing error:', error);
          setError('Failed to process voice input. Please try again.');
          setRecordingState('idle');
          setIsProcessing(false);
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingState('recording');
    } catch (error) {
      console.error('Recording error:', error);
      setError('Microphone access denied. Please allow microphone access.');
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // GPS Location Detection
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get address using reverse geocoding (optional - using OpenStreetMap Nominatim)
        let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data.display_name) {
            address = data.display_name;
          }
        } catch (error) {
          console.log('Reverse geocoding failed, using coordinates');
        }

        setGpsLocation({
          latitude,
          longitude,
          address
        });
        setLocation(address); // Auto-fill location field
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    if (image) formData.append('image', image);
    if (audio) formData.append('audio', audio);
    if (description) formData.append('description', description);
    formData.append('location', location || 'unknown');
    
    // Add GPS coordinates if available
    if (gpsLocation.latitude && gpsLocation.longitude) {
      formData.append('latitude', gpsLocation.latitude.toString());
      formData.append('longitude', gpsLocation.longitude.toString());
    }
    
    // Add voice data if available
    if (voiceData) {
      formData.append('original_text', voiceData.original_text);
      formData.append('detected_language', voiceData.detected_language);
      formData.append('input_method', 'voice');
    }

    console.log('Submitting report with data:');
    for (const [key, value] of formData.entries()) {
      console.log(key, value instanceof File ? value.name : value);
    }

    try {
      const API_URL = 'http://localhost:8001';
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/reports/submit`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const result = await response.json();
      console.log('Report submitted:', result);
      setSubmittedReport(result.report || result); // Fix report data handling
      // Reset form
      setDescription('');
      setLocation('');
      setImage(null);
      setAudio(null);
      setVoiceData(null);
      setError(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report');
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedReport) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Sanitex</h1>
              <span className="text-sm text-gray-400">Report Submitted</span>
            </div>
            <button
              onClick={() => setSubmittedReport(null)}
              className="text-gray-400 hover:text-white font-medium"
            >
              Submit Another Report
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gray-900 rounded-xl shadow-md border border-gray-800">
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h2 className="text-xl font-semibold text-white">Report Submitted Successfully</h2>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-6">Report Details</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Location</h4>
                  <p className="text-gray-200">{submittedReport.location || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                  <p className="text-gray-200">{submittedReport.description || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Severity</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    submittedReport.severity === 'High' ? 'bg-red-950 text-red-200' :
                    submittedReport.severity === 'Medium' ? 'bg-yellow-950 text-yellow-200' :
                    'bg-green-950 text-green-200'
                  }`}>
                    {submittedReport.severity}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Status</h4>
                  <p className="text-gray-200">{submittedReport.status || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Estimated Time</h4>
                  <p className="text-gray-200">{submittedReport.estimated_time || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">AI Analysis</h4>
                  <p className="text-gray-200">{submittedReport.analysis || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-800">
                <p className="text-sm text-gray-400">
                  Submitted on {submittedReport.timestamp ? new Date(submittedReport.timestamp).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Sanitex</h1>
            <span className="text-sm text-gray-400">Report Form</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white font-medium"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-xl shadow-md border border-gray-800">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Submit Sanitation Report</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Location *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Building A - Floor 2 - Restroom"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      isGettingLocation ? 'bg-orange-600 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isGettingLocation ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Getting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          GPS
                        </>
                      )}
                    </div>
                  </button>
                </div>
                
                {locationError && (
                  <div className="mt-2 p-2 bg-yellow-950 border border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-200">{locationError}</p>
                  </div>
                )}
                
                {gpsLocation.latitude && gpsLocation.longitude && (
                  <div className="mt-2 p-2 bg-green-950 border border-green-800 rounded-lg">
                    <p className="text-xs text-green-200">
                      📍 Location detected: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the sanitation issue in detail..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  required
                />
              </div>

              {/* Voice Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Voice Input (Hindi, English, Telugu)
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  You can speak in Hindi, English, or Telugu. We'll automatically detect the language and translate to English.
                </p>
                
                {error && (
                  <div className="mb-3 p-3 bg-red-950 border border-red-800 rounded-lg">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                    isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 
                    isProcessing ? 'bg-orange-600 text-white cursor-not-allowed' : 
                    'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isRecording ? (
                      <>
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        Stop Recording
                      </>
                    ) : isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                        </svg>
                        Start Voice Recording
                      </>
                    )}
                  </div>
                </button>
                
                {voiceData && (
                  <div className="mt-4 p-4 bg-blue-950 border border-blue-800 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-blue-300 uppercase">Detected Language:</span>
                        <span className="ml-2 text-sm text-white">{voiceData.detected_language}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-300 uppercase">Original Text:</span>
                        <p className="text-sm text-gray-300 mt-1 italic">"{voiceData.original_text}"</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-300 uppercase">Translated to English:</span>
                        <p className="text-sm text-white mt-1">"{voiceData.translated_text}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Upload Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {image && (
                    <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {image.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Upload Audio (Optional)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudio(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {audio && (
                    <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {audio.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                  isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Report
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}