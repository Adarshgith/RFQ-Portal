'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (data.user.role === 'ADMIN') window.location.href = '/dashboard/admin'
      else if (data.user.role === 'BUYER') window.location.href = '/dashboard/buyer'
      else window.location.href = '/dashboard/vendor'

    } catch (err) {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      {/* Navbar */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 font-bold text-xl">
          Bidveda RFQ Portal
        </Link>
        <Link
          href="/"
          className="text-sm text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-gray-600 text-sm">Sign in to your Bidveda account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Test Credentials
            </p>
            <div className="space-y-2">
              {[
                { role: 'Admin', email: 'admin@bidveda.com', color: 'text-purple-600' },
                { role: 'Buyer', email: 'buyer@bidveda.com', color: 'text-blue-600' },
                { role: 'Vendor', email: 'vendor1@bidveda.com', color: 'text-green-600' },
              ].map(({ role, email, color }) => (
                <div
                  key={role}
                  className="flex justify-between items-center cursor-pointer hover:bg-white rounded-lg px-2 py-1 transition"
                  onClick={() => setEmail(email)}
                >
                  <span className={`text-xs font-medium ${color}`}>{role}</span>
                  <span className="text-xs text-gray-700">{email}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Password: <span className="font-medium text-gray-700">password@123</span>
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Click any role to auto-fill email
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}