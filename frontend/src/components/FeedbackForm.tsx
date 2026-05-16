
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export function FeedbackForm({ onSuccess, onCancel, showCancelButton = true }: FeedbackFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    category: 'General',
    subject: '',
    message: '',
    priority: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.subject.trim()) {
        setError('Subject is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.message.trim()) {
        setError('Message is required');
        setIsSubmitting(false);
        return;
      }

      console.log('📝 Submitting feedback form...');
      console.log('API URL:', API_URL);
      console.log('Form data:', formData);

      const token = localStorage.getItem('auth_token');
      console.log('Token available:', !!token);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Authorization header added');
      }

      console.log('Request headers:', headers);
      console.log('Request body:', JSON.stringify(formData));

      let response;
      try {
        response = await fetch(`${API_URL}/api/feedback/submit`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
      } catch (networkError) {
        console.error('Network error:', networkError);
        throw new Error('Network error. Please check your connection and try again.');
      }

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('Submission failed:', data);
        throw new Error(data.detail || 'Failed to submit feedback');
      }

      console.log('✅ Feedback submitted successfully!');
      setSuccess('Feedback submitted successfully! We\'ll review and respond soon.');
      
      // Reset form after a short delay
      setTimeout(() => {
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          category: 'General',
          subject: '',
          message: '',
          priority: 'Medium'
        });
        
        // Call success callback after form reset
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);

    } catch (err) {
      console.error('Feedback submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while submitting feedback';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bug': return '🐛';
      case 'Feature': return '✨';
      case 'Improvement': return '🚀';
      case 'General': return '💬';
      default: return '💬';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          Feedback
        </h2>
        {user && (
          <div className="text-sm text-gray-600">
            Logged in as {user.name || user.email}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
          <div>{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name {user && <span className="text-gray-400 text-xs">(auto-filled)</span>}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!user}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email {user && <span className="text-gray-400 text-xs">(auto-filled)</span>}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!user}
            />
          </div>
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="General">💬 General</option>
              <option value="Bug">🐛 Bug Report</option>
              <option value="Feature">✨ Feature Request</option>
              <option value="Improvement">🚀 Improvement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(formData.priority)}`}
            >
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Brief summary of your feedback"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Please provide detailed feedback about your experience, suggestions, or issues..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
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
                Submit Feedback
              </>
            )}
          </button>
          {showCancelButton && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="font-semibold mb-2">📋 Feedback Guidelines:</div>
          <ul className="space-y-1 text-xs">
            <li>• Be specific and provide detailed information</li>
            <li>• Include steps to reproduce bugs</li>
            <li>• Suggest improvements or new features</li>
            <li>• We'll review and respond to your feedback</li>
            <li>• High priority issues will be addressed first</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
