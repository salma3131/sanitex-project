'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FeedbackModal } from '@/components/FeedbackModal';

interface Report {
  id: string;
  location: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Resolved';
  timestamp: string;
  analysis: string;
  estimated_time: string;
}

export function UserDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const API_URL = 'http://localhost:8001';
  const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
  
  console.log('UserDashboard - WebSocket URL:', wsUrl);

  // Fetch all reports
  const fetchReports = useCallback(async () => {
    try {
      if (!token) {
        console.error('No token available');
        return;
      }

      console.log('Fetching reports with token:', token ? 'Available' : 'Not available');
      const response = await fetch(`${API_URL}/api/reports/my-reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });


      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
        }
        console.error('Failed to fetch reports:', errorData);
        
        // If authentication failed, logout and redirect to login
        if (response.status === 401) {
          console.log('Authentication failed - logging out');
          logout();
          router.push('/login');
          return;
        }
        
        throw new Error(errorData.detail || 'Failed to fetch reports');
      }

      let data;
      try {
        data = await response.json();
        console.log('Reports data received:', data);
        setReports(data.reports || []);
        setError('');
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError('Unable to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket(wsUrl, (message) => {
    console.log('📱 UserDashboard received WebSocket message:', message);
    if (message.type === 'NEW_REPORT') {
      console.log('📝 UserDashboard: New report received, refreshing data...');
      fetchReports(); // Refresh data when new report is created
    } else if (message.type === 'STATUS_UPDATE') {
      console.log('🔄 UserDashboard: Status update received, refreshing data...');
      fetchReports(); // Refresh data when status is updated
    }
  });

  // Initial load
  useEffect(() => {
    fetchReports();
  }, [token, fetchReports]);

  // Fallback polling every 30 seconds (reduced since WebSocket handles real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchReports(); // Only poll if WebSocket is not connected
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token, isConnected, fetchReports]);

  
  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    return report.status === filter.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusTextColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-gray-700';
      case 'In Progress': return 'text-blue-700';
      case 'Resolved': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  const statusBgColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-gray-100';
      case 'In Progress': return 'bg-blue-100';
      case 'Resolved': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const severityTextColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'text-green-700';
      case 'Medium': return 'text-yellow-700';
      case 'High': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const severityBgColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-green-100';
      case 'Medium': return 'bg-yellow-100';
      case 'High': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  
  if (isLoading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <svg className="w-full h-full text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <p className="text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Professional Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Sanitex</h1>
            <span className="text-sm text-gray-400">Smart City Sanitation Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="text-gray-400 hover:text-white font-medium"
            >
              Feedback
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-white font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl shadow-md p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Reports</p>
                <p className="text-2xl font-semibold text-white">{reports.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-950 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl shadow-md p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-semibold text-white">{reports.filter(r => r.status === 'Pending').length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l4 4m0 0l-4-4m4 4l-4-4"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl shadow-md p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-semibold text-white">{reports.filter(r => r.status === 'In Progress').length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-950 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl shadow-md p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-semibold text-white">{reports.filter(r => r.status === 'Resolved').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-950 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Filter Section */}
        <div className="bg-gray-900 rounded-xl shadow-md border border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              Filter Reports
            </h2>
            <span className="text-sm text-gray-400">{reports.length} total</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                <span>All Reports</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{reports.length}</span>
            </button>
            
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                filter === 'pending' 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md transform scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l4 4m0 0l-4-4m4 4l-4-4"/>
                </svg>
                <span>Pending</span>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">{reports.filter((r) => r.status === 'Pending').length}</span>
            </button>
            
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                filter === 'in-progress' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md transform scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>In Progress</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{reports.filter((r) => r.status === 'In Progress').length}</span>
            </button>
            
            <button
              onClick={() => setFilter('resolved')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                filter === 'resolved' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md transform scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Resolved</span>
              </div>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">{reports.filter((r) => r.status === 'Resolved').length}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Professional Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="bg-gray-900 rounded-xl shadow-lg p-12 text-center border border-gray-800">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 0l6 6m-6 0l6 6M21 12a9 9 0 11-18 0 9 9v6a9 9 0 00-18 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4H7v7h8v-2h4v6h2v2h4v8h2v2H7v2H6a2 2 0 00-2 2v-2a2 2 0 00-2 2z"/>
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
              <p className="text-gray-400 mb-6">Start by submitting your first sanitation report to track issues efficiently.</p>
              <button
                onClick={() => router.push('/report')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Create First Report
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div key={report.id} className="bg-gray-900 rounded-xl shadow-md border border-gray-800 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                {/* Report Header */}
                <div className="border-b border-gray-800 bg-gradient-to-r from-gray-800 to-gray-900 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${severityBgColor(report.severity)}`}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">{report.location}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l3 3m0-6l-3-3m6 3l-3-3"/>
                          </svg>
                          {formatDate(report.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityTextColor(report.severity)} ${severityBgColor(report.severity)}`}>
                        {report.severity}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusTextColor(report.status)} ${statusBgColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                    <p className="text-gray-300 leading-relaxed">{report.description}</p>
                  </div>

                  {/* Analysis Section */}
                  <div className="bg-blue-950 rounded-lg p-4 mb-4 border border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                      <h4 className="text-sm font-semibold text-blue-300">AI Analysis</h4>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{report.analysis}</p>
                  </div>

                  {/* Action & Timing */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="bg-indigo-950 rounded-lg px-4 py-2 border border-indigo-800">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l4 4m0 0l-4-4m4 4l-4-4"/>
                        </svg>
                        <div>
                          <span className="font-semibold text-indigo-300">Est. Time:</span>
                          <span className="text-indigo-400">{report.estimated_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Report ID: {report.id.substring(0, 8)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Update Indicator */}
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
              <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
            </span>
            Auto-refresh • Updates every 15 sec
          </span>
        </div>

        {/* Floating Feedback Button */}
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="fixed bottom-4 left-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
          title="Share Feedback"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Share Feedback
          </span>
        </button>
      </main>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
    </div>
  );
}
