'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Nav() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <nav className="bg-gray-900 border-b border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Sanitex</h1>
            <span className="text-sm text-gray-400">Smart City Sanitation</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-400 hover:text-white font-medium transition-colors">
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-gray-400 hover:text-white font-medium transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/report" className="text-gray-400 hover:text-white font-medium transition-colors">
                  Report
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{user.name || user.email}</span>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-white font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-400 hover:text-white font-medium transition-colors">
                  Login
                </Link>
                <Link href="/admin/login" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Admin
                </Link>
                <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Sanitex</h1>
          <span className="text-sm text-gray-400">Smart City Sanitation</span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-400 hover:text-white font-medium transition-colors">
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-gray-400 hover:text-white font-medium transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/report" className="text-gray-400 hover:text-white font-medium transition-colors">
                Report
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{user.name || user.email}</span>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-400 hover:text-white font-medium transition-colors">
                Login
              </Link>
              <Link href="/admin/login" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Admin
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}