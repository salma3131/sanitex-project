'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    setTimeout(() => {
      if (email === 'admin@sanitix.com' && password === 'admin123') {
        alert('Admin login successful');
        setEmail('');
        setPassword('');
      } else {
        setError('Invalid admin credentials');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-neutral-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👨‍💼</div>
            <h1 className="text-3xl font-bold text-neutral-dark">Admin Login</h1>
            <p className="text-gray-600 mt-2">Manage Sanitix operations</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-blue-700 text-sm font-medium\">Demo Credentials:</p>
            <p className="text-blue-600 text-sm\">Email: admin@sanitix.com</p>
            <p className="text-blue-600 text-sm\">Password: admin123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2\">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@sanitix.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2\">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
              {isLoading ? '⏳ Logging in...' : '✓ Login as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              <Link href="/login" className="text-green-600 font-semibold hover:underline\">User Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
