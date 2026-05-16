'use client';

import { useState } from 'react';

export default function ReportForm() {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [severity, setSeverity] = useState('medium');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported');
      return;
    }
    const rec = new (window as any).webkitSpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onstart = () => setIsRecording(true);
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev + ' ' + transcript);
      setIsRecording(false);
    };
    rec.onerror = () => setIsRecording(false);
    rec.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!text || !location) {
      alert('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      const formData = new FormData();
      formData.append('text', text);
      formData.append('location', location);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('severity', severity);
      if (image) {
        formData.append('image', image);
        console.log('Image selected:', image.name, 'Size:', image.size);
      } else {
        console.log('No image selected');
      }

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      try {
        const response = await fetch('http://localhost:8003/report-issue', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        setShowSuccess(true);
        setText('');
        setLocation('');
        setSeverity('medium');
        setImage(null);
        setTimeout(() => setShowSuccess(false), 5000);
      } catch (error) {
        console.error(error);
        alert('Error submitting report');
      } finally {
        setIsSubmitting(false);
      }
    }, () => {
      setIsSubmitting(false);
      alert('Unable to get location');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showSuccess && (
        <div className="badge-success p-4 rounded-xl flex items-center gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Issue reported successfully!
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
        <input
          type="text"
          placeholder="e.g., Building A - Restroom"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Describe the Issue *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe what you observed..."
          className="input-field min-h-32 resize-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Severity Level</label>
        <div className="grid grid-cols-3 gap-3">
          {['low', 'medium', 'high'].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setSeverity(level)}
              className={`p-3 rounded-xl font-medium transition-all ${
                severity === level
                  ? level === 'low' ? 'bg-green-100 border-2 border-green-500 text-green-700'
                    : level === 'medium' ? 'bg-yellow-100 border-2 border-yellow-500 text-yellow-700'
                    : 'bg-red-100 border-2 border-red-500 text-red-700'
                  : 'bg-gray-100 border-2 border-gray-200 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {level === 'low' ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Low
                  </>
                ) : level === 'medium' ? (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Medium
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    High
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image (Optional)</label>
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
          <div className="w-8 h-8 mb-2">
            <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <span className="text-sm text-gray-600">{image ? image.name : 'Click to upload'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={startRecording}
          disabled={isRecording}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            {isRecording ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                Recording...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
                Add Voice
              </>
            )}
          </div>
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 btn-primary disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m0 0l4 4m0 0l4-4-4m6 3l6 3m0-6l-3-3m6 3l-3-3"/>
                </svg>
                Submit Report
              </>
            )}
          </div>
        </button>
      </div>
    </form>
  );
}
