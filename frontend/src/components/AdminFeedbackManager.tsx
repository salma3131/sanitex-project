'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Feedback {
  id: string;
  user_id?: string;
  name?: string;
  email?: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_reply?: string;
  admin_reply_timestamp?: string;
  created_at: string;
  updated_at: string;
}

export function AdminFeedbackManager() {
  const { token } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const API_URL = 'http://localhost:8001';

  useEffect(() => {
    fetchFeedback();
  }, [filterStatus, filterCategory, filterPriority]);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

      const response = await fetch(`${API_URL}/api/admin/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If authentication failed, redirect to login
        if (response.status === 401) {
          console.log('Authentication failed - redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        throw new Error(errorData.detail || 'Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (err) {
      console.error('Fetch feedback error:', err);
      setError('Unable to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;

    try {
      setIsSubmittingReply(true);

      const response = await fetch(`${API_URL}/api/admin/feedback/${selectedFeedback.id}/reply`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply: replyText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If authentication failed, redirect to login
        if (response.status === 401) {
          console.log('Authentication failed - redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        throw new Error(errorData.detail || 'Failed to send reply');
      }

      const data = await response.json();
      console.log('Reply sent:', data);

      // Update the feedback in the list
      setFeedback(prev => prev.map(f => 
        f.id === selectedFeedback.id 
          ? { ...f, admin_reply: replyText, admin_reply_timestamp: new Date().toISOString(), status: 'Resolved' }
          : f
      ));

      // Clear reply form
      setReplyText('');
      setSelectedFeedback(null);
    } catch (err) {
      console.error('Reply error:', err);
      setError('Failed to send reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/feedback/${feedbackId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If authentication failed, redirect to login
        if (response.status === 401) {
          console.log('Authentication failed - redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        throw new Error(errorData.detail || 'Failed to update status');
      }

      // Update the feedback in the list
      setFeedback(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, status: newStatus } : f
      ));
    } catch (err) {
      console.error('Status update error:', err);
      setError('Failed to update status');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'In Review': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Resolved': return 'text-green-600 bg-green-50 border-green-200';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">💬</span>
          Feedback Management
        </h2>
        <div className="text-sm text-gray-600">
          {feedback.length} feedback items
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Bug">🐛 Bug</option>
            <option value="Feature">✨ Feature</option>
            <option value="Improvement">🚀 Improvement</option>
            <option value="General">💬 General</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading feedback...</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-600">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                    <h3 className="font-semibold text-gray-800">{item.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    From: {item.name || 'Anonymous'} {item.email && `(${item.email})`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(item.created_at)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.status !== 'Resolved' && (
                    <button
                      onClick={() => setSelectedFeedback(item)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                    >
                      Reply
                    </button>
                  )}
                  {item.status === 'Pending' && (
                    <button
                      onClick={() => handleStatusUpdate(item.id, 'In Review')}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-gray-700 mb-3">
                {item.message}
              </div>

              {item.admin_reply && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800 mb-1">
                    Admin Reply ({formatDate(item.admin_reply_timestamp || item.updated_at)})
                  </div>
                  <div className="text-green-700 text-sm">
                    {item.admin_reply}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Reply to Feedback</h3>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getCategoryIcon(selectedFeedback.category)}</span>
                  <h4 className="font-semibold">{selectedFeedback.subject}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedFeedback.priority)}`}>
                    {selectedFeedback.priority}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  From: {selectedFeedback.name || 'Anonymous'} {selectedFeedback.email && `(${selectedFeedback.email})`}
                </div>
                <div className="text-gray-700 bg-gray-50 rounded-lg p-3">
                  {selectedFeedback.message}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleReply}
                  disabled={isSubmittingReply || !replyText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                </button>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
