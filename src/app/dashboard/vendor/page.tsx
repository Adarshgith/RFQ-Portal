'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VendorDashboard() {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const [rfqs, setRfqs] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'VENDOR')) router.push('/login')
  }, [user, loading])

  const fetchRfqs = () => {
    if (!token) return
    const params = new URLSearchParams()
    if (search) params.set('keyword', search)
    if (category) params.set('category', category)
    if (location) params.set('location', location)

    fetch(`/api/rfqs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRfqs(d.rfqs || []); setFetching(false) })
  }

  useEffect(() => { fetchRfqs() }, [token])

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Bidveda RFQ Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👤 {user?.name} (Vendor)</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-black mb-6">Open RFQs</h2>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-3 flex-wrap">
          <input
            type="text" placeholder="Search by keyword..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="border rounded-lg text-black px-3 py-2 text-sm flex-1 min-w-[150px]"
          />
          <input
            type="text" placeholder="Category..."
            value={category} onChange={e => setCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-40 text-black"
          />
          <input
            type="text" placeholder="Location..."
            value={location} onChange={e => setLocation(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-40 text-black"
          />
          <button onClick={fetchRfqs} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Search
          </button>
        </div>

        {/* RFQ Cards */}
        <div className="grid gap-4">
          {rfqs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No open RFQs found</div>
          ) : rfqs.map(rfq => (
            <div key={rfq.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-black">{rfq.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{rfq.description}</p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>📦 {rfq.category}</span>
                    <span>📍 {rfq.location}</span>
                    <span>⏰ {new Date(rfq.deadline).toLocaleDateString()}</span>
                    {rfq.budget && <span>💰 ₹{rfq.budget.toLocaleString()}</span>}
                  </div>
                </div>
                <Link href={`/rfqs/${rfq.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">
                  View & Quote
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}