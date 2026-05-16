'use client';

import { useEffect, useState } from 'react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData({
        total_reports: 127,
        high_severity: 23,
        resolved: 89,
        in_progress: 15,
        by_location: [
          { location: 'Building A', count: 45 },
          { location: 'Building B', count: 32 },
          { location: 'Parking Lot', count: 28 },
          { location: 'Cafeteria', count: 22 },
        ],
        trend: [12, 15, 18, 14, 21, 19, 27]
      });
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-neutral-light py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-dark mb-2">📈 Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into sanitation operations</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">🔄</div>
            <p className="text-gray-600 mt-4">Loading analytics...</p>
          </div>
        ) : data ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="text-5xl font-bold text-green-600 mb-2">{data.total_reports}</div>
                <p className="text-gray-600 font-medium">Total Reports</p>
                <p className="text-sm text-gray-500 mt-2">All time submissions</p>
              </div>
              <div className="card">
                <div className="text-5xl font-bold text-red-600 mb-2">{data.high_severity}</div>
                <p className="text-gray-600 font-medium">High Priority</p>
                <p className="text-sm text-gray-500 mt-2">Requires urgent action</p>
              </div>
              <div className="card">
                <div className="text-5xl font-bold text-green-700 mb-2">{data.resolved}</div>
                <p className="text-gray-600 font-medium">Resolved</p>
                <p className="text-sm text-gray-500 mt-2">Completion rate: {Math.round((data.resolved/data.total_reports)*100)}%</p>
              </div>
              <div className="card">
                <div className="text-5xl font-bold text-blue-600 mb-2">{data.in_progress}</div>
                <p className="text-gray-600 font-medium">In Progress</p>
                <p className="text-sm text-gray-500 mt-2">Currently being handled</p>
              </div>
            </div>

            {/* Reports by Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card">
                <h2 className="text-xl font-bold mb-6 text-neutral-dark">Reports by Location</h2>
                <div className="space-y-4">
                  {data.by_location.map((item: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">{item.location}</span>
                        <span className="font-bold text-green-600">{item.count}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                          style={{ width: `${(item.count / data.total_reports) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold mb-6 text-neutral-dark">Weekly Trend</h2>
                <div className="flex items-end gap-3 h-48 justify-around">
                  {data.trend.map((count: number, idx: number) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all hover:shadow-lg"
                        style={{ height: `${(count / Math.max(...data.trend)) * 100}%` }}
                      />
                      <span className="text-xs text-gray-600 mt-2">Day {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
