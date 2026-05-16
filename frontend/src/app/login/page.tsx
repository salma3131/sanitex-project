'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FeedbackModal } from '@/components/FeedbackModal';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    console.log('[LOGIN] Attempting login for:', email);

    const result = await login(email, password);

    if (result.success) {
      console.log('[LOGIN] Success, redirecting to dashboard');
      router.push('/dashboard');
    } else {
      console.error('[LOGIN] Failed:', result.message);
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="inline-flex items-center gap-2 px-3 py-1 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg text-sm font-medium transition shadow-sm"
        >
          💬 Feedback
        </button>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SANITEX</h1>
          <p className="text-gray-600">User Login</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-semibold">
              Sign up
            </Link>
          </p>
          <p className="text-gray-600">
            Are you an admin?{' '}
            <Link href="/admin/login" className="text-green-600 hover:underline font-semibold">
              Admin Login
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-xs text-gray-700">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p>Email: user@sanitix.com</p>
          <p>Password: user123</p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg font-medium transition text-sm"
          >
            💬 Share Feedback
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Help us improve your experience
          </p>
        </div>
      </div>

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
    </div>
  );
}