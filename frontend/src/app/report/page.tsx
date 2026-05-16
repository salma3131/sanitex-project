'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReportForm from '@/components/ReportForm';

export default function ReportPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Report Issue</h1>
          <p className="text-gray-600 text-sm mt-1">Submit by {user?.name || 'User'}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <ReportForm />
      </div>

      <div className="max-w-2xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 mb-2">📸 Upload Images</h3>
          <p className="text-sm text-blue-700">Upload clear photos for AI analysis and faster assessment.</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <h3 className="font-semibold text-green-900 mb-2">🎤 Voice Report</h3>
          <p className="text-sm text-green-700">Record your concerns verbally for convenience.</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
          <h3 className="font-semibold text-purple-900 mb-2">✍️ Text Description</h3>
          <p className="text-sm text-purple-700">Describe the issue in detail for better analysis.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-900 text-sm">
          <span className="font-semibold">💡 Tip:</span> Your location is automatically detected using GPS. Reports are analyzed using AI and forwarded to relevant authorities.
        </p>
      </div>
    </div>
  );
}