'use client';

import { useState } from 'react';

interface Report {
  id: string;
  location: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  date: string;
  assignedTo?: string;
}

const mockReports: Report[] = [
  { id: '1', location: 'Building A - Restroom', description: 'Floor is wet and slippery', status: 'in-progress', severity: 'high', date: '2 hours ago', assignedTo: 'John Doe' },
  { id: '2', location: 'Parking Lot - Area 3', description: 'Broken glass near entrance', status: 'pending', severity: 'high', date: '5 hours ago' },
  { id: '3', location: 'Building B - Hallway', description: 'Trash overflow in bin', status: 'resolved', severity: 'medium', date: '1 day ago', assignedTo: 'Jane Smith' },
  { id: '4', location: 'Cafeteria - Tables', description: 'Sticky tables need cleaning', status: 'pending', severity: 'low', date: '3 hours ago' },
];

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const updateStatus = (id: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    highSeverity: reports.filter(r => r.severity === 'high').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">👨‍💼 Admin Panel</h1>
          <p className="text-gray-600">Manage all complaints and oversee operations</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="card">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-gray-600 text-sm">Total Issues</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-gray-600 text-sm">Pending</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-gray-600 text-sm">In Progress</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-gray-600 text-sm">Resolved</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-red-600">{stats.highSeverity}</div>
            <p className="text-gray-600 text-sm">High Priority</p>
          </div>
        </div>

        {/* Issues Management */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">📋 All Complaints</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-gray-200">
                <tr>
                  <th className="pb-3 font-semibold text-gray-700">Location</th>
                  <th className="pb-3 font-semibold text-gray-700">Description</th>
                  <th className="pb-3 font-semibold text-gray-700">Severity</th>
                  <th className="pb-3 font-semibold text-gray-700">Status</th>
                  <th className="pb-3 font-semibold text-gray-700">Assigned To</th>
                  <th className="pb-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 font-medium text-gray-900">{report.location}</td>
                    <td className="py-4 text-gray-600">{report.description}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        report.severity === 'high' ? 'bg-red-100 text-red-800' :
                        report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {report.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">
                      <select
                        value={report.status}
                        onChange={(e) => {
                          const status = e.currentTarget.value;
                          if (status === 'pending' || status === 'in-progress' || status === 'resolved') {
                            updateStatus(report.id, status);
                          }
                        }}
                        className="px-3 py-1 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-green-600"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="py-4 text-gray-600">{report.assignedTo || '-'}</td>
                    <td className="py-4">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
