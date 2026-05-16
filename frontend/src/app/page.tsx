'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Bar */}
      <nav className="bg-gray-900 border-b border-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            SANITEX
          </Link>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-gray-300 font-medium">{user?.name || user?.email}</span>
                <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                  {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-blue-400 font-semibold">
                  Login
                </Link>
                <Link href="/signup" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-6">
            SanitEx
          </h1>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-6">
            Smart Sanitation Management System
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Report sanitation issues instantly using text, voice, or images. Our AI-powered system automatically analyzes problems and connects with authorities for faster resolution.
          </p>
        </div>

        <div className="flex gap-6 justify-center flex-wrap">
          {isAuthenticated ? (
            <>
              <Link href={user?.role === 'admin' ? '/admin' : '/report'} className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105">
                {user?.role === 'admin' ? 'View Dashboard' : 'Report Issue Now'}
              </Link>
              <Link href="/dashboard" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105">
                My Reports
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105">
                Get Started
              </Link>
              <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105">
                Create Account
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-4xl font-bold text-center mb-16 text-white">
          Why Choose SanitEx?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800">
            <div className="w-12 h-12 bg-blue-950 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white">Image Reports</h4>
            <p className="text-gray-400">
              Upload photos for AI-powered instant verification and severity assessment.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800">
            <div className="w-12 h-12 bg-purple-950 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white">Voice Input</h4>
            <p className="text-gray-400">
              Report hands-free using voice - quick, easy, and accessible.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800">
            <div className="w-12 h-12 bg-indigo-950 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white">AI Analysis</h4>
            <p className="text-gray-400">
              Automatic severity detection and intelligent issue classification.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800">
            <div className="w-12 h-12 bg-green-950 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white">GPS Tagging</h4>
            <p className="text-gray-400">
              Automatically detect and tag locations for faster authority response.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800">
            <div className="w-12 h-12 bg-cyan-950 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white">Live Dashboard</h4>
            <p className="text-gray-400">
              Real-time tracking of all reports with automatic status updates.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800">
            <div className="w-12 h-12 bg-orange-950 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3l4 4m0-6l-4-4m6 3l-4-4"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white">Fast Resolution</h4>
            <p className="text-gray-400">
              Get estimated times and track progress until resolution.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800">
            <div className="w-12 h-12 bg-red-950 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white">Secure & Private</h4>
            <p className="text-gray-400">
              Your data protected with enterprise-grade security.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-center text-white shadow-xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of community members helping keep neighborhoods clean and safe.
          </p>
          {!isAuthenticated && (
            <div className="flex gap-6 justify-center flex-wrap">
              <Link href="/signup" className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:shadow-lg transition transform hover:scale-105">
                Create Free Account
              </Link>
              <Link href="/login" className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold transition">
                Login to Account
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">SanitEx</h3>
              <p className="text-sm">
                Smart sanitation management for cleaner communities.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>Image Reports</li>
                <li>Voice Input</li>
                <li>AI Analysis</li>
                <li>Live Tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: info@sanitex.com</li>
                <li>Phone: +1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2026 SanitEx. All rights reserved. | Smart Sanitation Management System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
