'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

    console.log('[ADMIN LOGIN] Attempting login for:', email);

    const result = await login(email, password);

    if (result.success) {
      // Check if user is admin
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'admin') {
          console.log('[ADMIN LOGIN] Success, redirecting to admin dashboard');
          router.push('/admin');
        } else {
          console.error('[ADMIN LOGIN] User is not an admin');
          setError('Access denied: Admin credentials required');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
    } else {
      console.error('[ADMIN LOGIN] Failed:', result.message);
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SANITEX</h1>
          <p className="text-green-600 font-semibold">Admin Dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Admin Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            User?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              User Login
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-xs text-gray-700">
          <p className="font-semibold mb-2">Demo Admin Credentials:</p>
          <p>Email: admin@sanitix.com</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  );
}