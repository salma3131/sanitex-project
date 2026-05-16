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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/reports`);
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterSeverity && report.severity !== filterSeverity) return false;
    if (filterStatus && report.status !== filterStatus) return false;
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      case 'Low':
        return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900">📋 Report History</h1>
            <Link href="/" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              ← Back Home
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Severity:</label>
              <select
                value={filterSeverity || ''}
                onChange={(e) => setFilterSeverity(e.target.value || null)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status:</label>
              <select
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No reports found.</p>
            <Link href="/report" className="text-green-600 hover:underline mt-2 inline-block">
              Submit a new report
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div key={report.id} className={`rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition ${getSeverityColor(report.severity)}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{report.location}</h3>
                      <p className="text-sm opacity-75">ID: {report.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>

                  <p className="mb-3 text-sm">{report.description}</p>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">🚨 Severity:</span> {report.severity}
                    </div>
                    <div>
                      <span className="font-semibold">🧠 Analysis:</span> {report.analysis}
                    </div>
                    <div>
                      <span className="font-semibold">⏳ ETA:</span> {report.estimated_time}
                    </div>
                    <div>
                      <span className="font-semibold">📅 Submitted:</span> {new Date(report.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
