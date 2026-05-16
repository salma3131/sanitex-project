'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Analytics() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/admin/login');
            return;
          }
          throw new Error('Failed to fetch analytics data');
        }

        const analyticsData = await response.json();
        console.log('[ANALYTICS] Fetched data:', analyticsData);
        setData(analyticsData);
        setError(null);
      } catch (error) {
        console.error('[ANALYTICS] Error fetching data:', error);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchAnalytics();
    } else {
      setError('Authentication required');
      setIsLoading(false);
    }
  }, [token, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Analytics Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">SANITEX</h1>
                <p className="text-sm text-gray-500 font-medium">Analytics Dashboard</p>
              </div>
            </div>
            <div className="ml-auto">
              <span className="text-sm text-gray-600">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {data?.summary ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Reports</h3>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z"/>
                      <path d="M3 13h8V3H3v10zm0 8a2 2 0 002-2h2a2 2 0 002 2v2a2 2 0 002-2H3a2 2 0 00-2-2v-2z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800">{data.summary.total_reports}</p>
                <p className="text-xs text-gray-500 mt-1">All reports</p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">High Severity</h3>
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-600">{data.summary.high_severity}</p>
                <p className="text-xs text-gray-500 mt-1">Critical issues</p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Pending</h3>
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l3 3m0-6l-3-3m6 3l-3-3"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{data.summary.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Resolved</h3>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7l-4 4m0 0l4-4-4-4M6 16l-4 4m0 0l4-4-4-4"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600">{data.summary.resolved}</p>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </div>
            </div>

            {/* Resolution Rate */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resolution Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${data.resolution_rate}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{data.resolution_rate}%</span>
              </div>
            </div>

            {/* Location Stats */}
            {data.location_stats && Object.keys(data.location_stats).length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports by Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(data.location_stats).map(([location, stats]: [string, any]) => (
                    <div key={location} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">{location}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-medium text-yellow-600">{stats.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Resolved:</span>
                          <span className="font-medium text-green-600">{stats.resolved}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Analytics Data</h3>
              <p className="text-gray-600">No reports found in the system. Analytics will appear once reports are submitted.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}