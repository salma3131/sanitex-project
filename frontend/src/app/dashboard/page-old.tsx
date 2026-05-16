'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Report {
  id: string;
  location: string;
  description: string;
  status: string;
  severity: string;
  timestamp: string;
  analysis: string;
  estimated_time: string;
}

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'user') {
      router.push('/admin');
      return;
    }

    if (user) {
      fetchReports();
      // Set up polling for live updates
      const interval = setInterval(() => {
        console.log('[DASHBOARD] Polling for updates...');
        fetchReports();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user, authLoading, router]);

  const fetchReports = async () => {
    try {
      console.log('[DASHBOARD] Fetching reports...');
      const response = await fetch('http://localhost:8002/reports');
      const data = await response.json();
      console.log('[DASHBOARD] Fetched reports:', data.reports?.length || 0);
      setReports(data.reports || []);
    } catch (error) {
      console.error('[DASHBOARD] Error fetching reports:', error);
    } finally {
      setIsLoading(false);
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
        return 'bg-orange-100 text-orange-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Reports Dashboard</h1>
          <p className="text-gray-600">Track the status of your submitted sanitation reports</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg mb-2">No reports submitted yet</p>
            <p className="text-gray-500 text-sm mb-4">Your submitted reports will appear here</p>
            <a
              href="/report"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Your First Report
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{report.location}</h3>
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-semibold text-sm ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>Analysis:</strong> {report.analysis}</p>
                  <p><strong>Estimated Time:</strong> {report.estimated_time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
