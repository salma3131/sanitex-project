'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Placeholder login
    setTimeout(() => {
      if (email && password.length >= 6) {
        alert('Login successful (placeholder)');
        setEmail('');
        setPassword('');
      } else {
        setError('Please enter valid credentials');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-neutral-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👤</div>
            <h1 className="text-3xl font-bold text-neutral-dark">User Login</h1>
            <p className="text-gray-600 mt-2">Access your Sanitix account</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
              {isLoading ? '⏳ Logging in...' : '✓ Login'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-center text-gray-600">
              Don't have an account? <Link href="/signup" className="text-green-600 font-semibold hover:underline">Sign up</Link>
            </p>
            <p className="text-center text-gray-600">
              <Link href="/admin/login" className="text-blue-600 font-semibold hover:underline">Admin Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
