'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AdminFeedbackManager } from '@/components/AdminFeedbackManager';

interface Report {
  id: string;
  user_id: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Resolved';
  timestamp: string;
  analysis: string;
  estimated_time: string;
  assigned_workers: number;
}

interface Analytics {
  summary: {
    total_reports: number;
    high_severity: number;
    medium_severity: number;
    low_severity: number;
    pending: number;
    in_progress: number;
    resolved: number;
  };
  by_location: Record<string, any>;
  resolution_rate: number;
}

export function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is authenticated and has admin privileges
  useEffect(() => {
    if (!isLoading) {
      if (!user || !token) {
        console.log('No user or token, redirecting to admin login');
        router.push('/admin/login');
        return;
      }
      
      if (user.role !== 'admin') {
        console.log('User is not admin, redirecting to regular login');
        logout();
        router.push('/login');
        return;
      }
      
      console.log('Admin user authenticated:', user.email);
    }
  }, [user, token, isLoading, logout, router]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newWorkers, setNewWorkers] = useState(0);
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'feedback'>('reports');

  const API_URL = 'http://localhost:8001';
  const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
  
  console.log('AdminDashboard - WebSocket URL:', wsUrl);

  // Fetch all reports and analytics
  const fetchData = useCallback(async () => {
    try {
      if (!token) {
        console.error('No token available');
        return;
      }

      // Check if user is admin before fetching admin data
      if (!user || user.role !== 'admin') {
        console.error('User is not admin, cannot fetch admin data');
        setError('Admin access required');
        return;
      }

      console.log('Fetching admin data with token:', token ? 'Available' : 'Not available');
      console.log('User role:', user?.role);
      console.log('User email:', user?.email);
      
      const response = await fetch(`${API_URL}/api/admin/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response statusText:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Only handle actual HTTP errors (4xx, 5xx)
      if (!response.ok) {
        console.log('🚨 Admin API error condition triggered - response.ok is false');
        const errorData = await response.json().catch(() => ({}));
        console.error('Admin API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // Handle specific authentication errors
        if (response.status === 401) {
          console.log('Admin authentication failed - logging out');
          logout();
          router.push('/login');
          return;
        } else if (response.status === 403) {
          console.log('Admin access required - user is not admin');
          setError('Admin access required. Please login as an administrator.');
          return;
        }
        
        throw new Error(`Failed to fetch admin data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Admin data received:', data);
      setReports(data.reports || []);
      setAnalytics(data.analytics || null);

      // Fetch analytics
      console.log('Fetching analytics data...');
      const analyticsResponse = await fetch(`${API_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Analytics response status:', analyticsResponse.status);
      console.log('Analytics response ok:', analyticsResponse.ok);
      console.log('Analytics response headers:', Object.fromEntries(analyticsResponse.headers.entries()));

      // Only handle actual HTTP errors (4xx, 5xx)
      if (!analyticsResponse.ok) {
        console.log('🚨 Analytics API error condition triggered - response.ok is false');
        const analyticsErrorData = await analyticsResponse.json().catch(() => ({}));
        console.error('Analytics API error details:', {
          status: analyticsResponse.status,
          statusText: analyticsResponse.statusText,
          errorData: analyticsErrorData
        });
        
        if (analyticsResponse.status === 401) {
          console.error('Token expired or invalid, logging out...');
          logout();
          router.push('/admin/login');
          return;
        }
        console.warn('Failed to fetch analytics, continuing without analytics data');
      } else {
        const analyticsData = await analyticsResponse.json();
        console.log('Analytics data received:', analyticsData);
        setAnalytics(analyticsData);
      }

      setError('');
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Unable to load data');
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  // WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket(wsUrl, (message) => {
    console.log('👨‍💼 AdminDashboard received WebSocket message:', message);
    if (message.type === 'NEW_REPORT') {
      console.log('📝 AdminDashboard: New report received, refreshing data...');
      fetchData(); // Refresh data when new report is created
    } else if (message.type === 'STATUS_UPDATE') {
      console.log('🔄 AdminDashboard: Status update received, refreshing data...');
      fetchData(); // Refresh data when status is updated
    }
  });

  // Initial load
  useEffect(() => {
    fetchData();
  }, [token, fetchData]);

  // Fallback polling every 30 seconds (reduced since WebSocket handles real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchData(); // Only poll if WebSocket is not connected
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token, isConnected, fetchData]);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reports/${reportId}/status?status=${encodeURIComponent(status)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        if (response.status === 401) {
          console.error('Token expired or invalid, logging out...');
          logout();
          router.push('/admin/login');
          return;
        }
        throw new Error(`Failed to update status: ${errorData.detail || response.statusText}`);
      }

      console.log('✓ Status updated successfully');
      setSelectedReport(null);
      fetchData();
    } catch (err) {
      console.error('Update status error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleAssignWorkers = async (reportId: string, workers: number) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reports/${reportId}/assign?workers=${workers}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        if (response.status === 401) {
          console.error('Token expired or invalid, logging out...');
          logout();
          router.push('/admin/login');
          return;
        }
        throw new Error(`Failed to assign workers: ${errorData.detail || response.statusText}`);
      }

      console.log('✓ Workers assigned successfully');
      setSelectedReport(null);
      fetchData();
    } catch (err) {
      console.error('Assign workers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign workers');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return report.status === 'Pending';
    if (filter === 'in-progress') return report.status === 'In Progress';
    if (filter === 'resolved') return report.status === 'Resolved';
    return true;
  });

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-950 text-red-200 border-red-800';
      case 'Medium':
        return 'bg-yellow-950 text-yellow-200 border-yellow-800';
      case 'Low':
        return 'bg-green-950 text-green-200 border-green-800';
      default:
        return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-blue-950 text-blue-200 border-blue-800';
      case 'In Progress':
        return 'bg-purple-950 text-purple-200 border-purple-800';
      case 'Resolved':
        return 'bg-green-950 text-green-200 border-green-800';
      default:
        return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Professional Admin Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Sanitex</h1>
            <span className="text-sm text-gray-400">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="bg-gray-900 rounded-xl shadow-md border border-gray-800 mb-6">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-950'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-950'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-950'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Feedback
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            {/* Professional Filter Section */}
            <div className="bg-gray-900 rounded-xl shadow-md border border-gray-800 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011 1v10a1 1 0 01-1 1h10a1 1 0 01-1 1V4a1 1 0 00-1-1z"/>
                    <path d="M3 13h8V3H3v10zm0 8a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 002-2H3a2 2 0 00-2-2v-2z"/>
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
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16a2 2 0 002 2v8a2 2 0 002-2H6a2 2 0 00-2-2V6a2 2 0 00-2-2z"/>
                      <path d="M7 9h10V7H7v2zm0 4a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 002-2H7a2 2 0 00-2-2v-2z"/>
                    </svg>
                    <span>All Reports</span>
                  </div>
                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">{reports.length}</span>
                </button>
                
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    filter === 'pending' 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md transform scale-105' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l3 3m0-6l-3-3m6 3l-3-3"/>
                    </svg>
                    <span>Pending</span>
                  </div>
                  <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full">{reports.filter((r) => r.status === 'Pending').length}</span>
                </button>
                
                <button
                  onClick={() => setFilter('in-progress')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    filter === 'in-progress' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md transform scale-105' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span>In Progress</span>
                  </div>
                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">{reports.filter((r) => r.status === 'In Progress').length}</span>
                </button>
                
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    filter === 'resolved' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md transform scale-105' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Resolved</span>
                  </div>
                  <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">{reports.filter((r) => r.status === 'Resolved').length}</span>
                </button>
              </div>
            </div>

            {/* Professional Reports Grid */}
            {filteredReports.length === 0 ? (
              <div className="bg-gray-900 rounded-xl shadow-lg p-12 text-center border border-gray-800">
                <div className="max-w-md mx-auto">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 0l6 6m-6 0l6 6M21 12a9 9 0 11-18 0 9 9v6a9 9 0 00-18 0z"/>
                    <path d="M13 16h-1v-4H7v7h8v-2h4v6h2v2h4v8h2v2H7v2H6a2 2 0 00-2 2v-2a2 2 0 00-2 2z"/>
                  </svg>
                  <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
                  <p className="text-gray-400">No reports match the current filter criteria.</p>
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${severityColor(report.severity).split(' ')[0]}`}>
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{report.location}</h3>
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l3 3m0-6l-3-3m6 3l-3-3"/>
                                </svg>
                                {formatDate(report.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColor(report.severity)}`}>
                            {report.severity}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Report Content */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-700 leading-relaxed text-sm">{report.description}</p>
                      </div>

                      {/* GPS Location */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Location Details</h4>
                        {report.latitude && report.longitude ? (
                          <div className="space-y-2">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-xs text-gray-600 mb-1">GPS Coordinates</p>
                              <p className="font-mono text-sm text-gray-800">
                                {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                              </p>
                            </div>
                            <a 
                              href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              View on Maps
                            </a>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-500">No GPS data available</p>
                          </div>
                        )}
                      </div>

                      {/* Worker Assignment */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Worker Assignment</h4>
                        <div className="bg-indigo-50 rounded-lg px-4 py-2 border border-indigo-200">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                            </svg>
                            <span className="font-semibold text-indigo-800">{report.assigned_workers}</span>
                            <span className="text-indigo-600">workers assigned</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setNewStatus(report.status);
                            setNewWorkers(report.assigned_workers || 0);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                          Manage Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            {analytics && (
              <div>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <p className="text-gray-600 text-sm font-semibold">Total Reports</p>
                    <p className="text-4xl font-bold text-gray-800 mt-2">{analytics.summary.total_reports}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <p className="text-gray-600 text-sm font-semibold">High Severity</p>
                    <p className="text-4xl font-bold text-red-600 mt-2">{analytics.summary.high_severity}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                    <p className="text-gray-600 text-sm font-semibold">Medium Severity</p>
                    <p className="text-4xl font-bold text-yellow-600 mt-2">{analytics.summary.medium_severity}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <p className="text-gray-600 text-sm font-semibold">Resolution Rate</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">{analytics.resolution_rate}%</p>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-gray-600 font-semibold mb-4">Status Breakdown</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">Pending</span>
                          <span className="font-bold text-blue-600">{analytics.summary.pending}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.summary.pending / analytics.summary.total_reports) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">In Progress</span>
                          <span className="font-bold text-purple-600">{analytics.summary.in_progress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.summary.in_progress / analytics.summary.total_reports) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">Resolved</span>
                          <span className="font-bold text-green-600">{analytics.summary.resolved}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.summary.resolved / analytics.summary.total_reports) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-gray-600 font-semibold mb-4">Severity Distribution</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">High</span>
                          <span className="font-bold text-red-600">{analytics.summary.high_severity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.summary.high_severity / analytics.summary.total_reports) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">Medium</span>
                          <span className="font-bold text-yellow-600">{analytics.summary.medium_severity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.summary.medium_severity / analytics.summary.total_reports) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">Low</span>
                          <span className="font-bold text-green-600">{analytics.summary.low_severity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.summary.low_severity / analytics.summary.total_reports) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-gray-600 font-semibold mb-4">Performance</p>
                    <div className="space-y-3 text-center">
                      <div>
                        <p className="text-5xl font-bold text-green-600">{analytics.resolution_rate}%</p>
                        <p className="text-sm text-gray-600">Resolution Rate</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-2xl font-bold text-gray-800">{analytics.summary.resolved}</p>
                        <p className="text-sm text-gray-600">Resolved Reports</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <p className="text-gray-800 p-3 bg-gray-50 rounded">{selectedReport.location}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">GPS Coordinates</label>
                <p className="text-gray-800 p-3 bg-gray-50 rounded font-mono text-sm">
                  {selectedReport.latitude && selectedReport.longitude ? (
                    `${selectedReport.latitude.toFixed(6)}, ${selectedReport.longitude.toFixed(6)}`
                  ) : (
                    'No GPS data available'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Map Location</label>
                {selectedReport.latitude && selectedReport.longitude ? (
                  <a 
                    href={`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline p-3 bg-blue-50 rounded block text-sm"
                  >
                    <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    View on Google Maps
                  </div>
                  </a>
                ) : (
                  <p className="text-gray-500 p-3 bg-gray-50 rounded text-sm">No location data available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Workers</label>
                <input
                  type="number"
                  min="0"
                  value={newWorkers || 0}
                  onChange={(e) => setNewWorkers(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedReport.id, newStatus);
                    handleAssignWorkers(selectedReport.id, newWorkers);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <AdminFeedbackManager />
        )}
      </main>

      <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow text-sm">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
            <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
          </span>
          Auto-refresh • Updates every 10 sec
        </span>
      </div>
    </div>
  );
}
