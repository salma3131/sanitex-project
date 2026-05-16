'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  location: string;
  description: string;
  severity: string;
  status: string;
  timestamp: string;
  analysis: string;
  estimated_time: string;
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchReports();
    fetchAnalytics();

    // Set up polling for live updates every 3 seconds
    const interval = setInterval(() => {
      console.log('[ADMIN] Polling for updates...');
      fetchReports();
      fetchAnalytics();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      console.log('[ADMIN] Fetching reports...');
      const response = await fetch('http://localhost:8002/reports');
      const data = await response.json();
      console.log('[ADMIN] Fetched reports:', data.reports?.length || 0);
      setReports(data.reports || []);
    } catch (error) {
      console.error('[ADMIN] Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      console.log('[ADMIN] Fetching analytics...');
      const response = await fetch('http://localhost:8002/analytics');
      const data = await response.json();
      console.log('[ADMIN] Analytics data:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('[ADMIN] Error fetching analytics:', error);
    }
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      console.log(`[ADMIN] Updating report ${reportId} to status: ${newStatus}`);
      const response = await fetch(`http://localhost:8002/update-status/${reportId}?status=${newStatus}`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success) {
        console.log(`[ADMIN] Successfully updated report ${reportId}`);
        // Immediately update local state for instant UI feedback
        setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
        // Refresh analytics to get updated counts
        fetchAnalytics();
      } else {
        console.error(`[ADMIN] Failed to update report ${reportId}:`, data.error);
      }
    } catch (error) {
      console.error(`[ADMIN] Error updating report ${reportId}:`, error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'text-red-600 bg-red-50';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'Low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-orange-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900">🛡️ Admin Dashboard</h1>
            <Link href="/" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              ← Back Home
            </Link>
          </div>

          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-blue-500 text-white p-4 rounded-lg shadow">
                <p className="text-sm opacity-90">Total Reports</p>
                <p className="text-3xl font-bold">{analytics.total_reports}</p>
              </div>
              <div className="bg-red-500 text-white p-4 rounded-lg shadow">
                <p className="text-sm opacity-90">High Severity</p>
                <p className="text-3xl font-bold">{analytics.high_severity}</p>
              </div>
              <div className="bg-yellow-500 text-white p-4 rounded-lg shadow">
                <p className="text-sm opacity-90">Medium Severity</p>
                <p className="text-3xl font-bold">{analytics.medium_severity}</p>
              </div>
              <div className="bg-green-500 text-white p-4 rounded-lg shadow">
                <p className="text-sm opacity-90">Resolved</p>
                <p className="text-3xl font-bold">{analytics.resolved}</p>
              </div>
              <div className="bg-orange-500 text-white p-4 rounded-lg shadow">
                <p className="text-sm opacity-90">Pending</p>
                <p className="text-3xl font-bold">{analytics.pending}</p>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg mb-2">No reports yet</p>
            <p className="text-gray-500 text-sm">Reports will appear here automatically when submitted</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{report.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{report.description}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full font-semibold text-sm ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-white font-semibold text-sm ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(report.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <select
                            value={report.status}
                            onChange={(e) => updateStatus(report.id, e.target.value)}
                            className="p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
