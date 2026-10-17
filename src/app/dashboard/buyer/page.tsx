'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BuyerDashboard() {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const [rfqs, setRfqs] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'BUYER')) router.push('/login')
  }, [user, loading])

  useEffect(() => {
    if (!token) return
    fetch('/api/rfqs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRfqs(d.rfqs || []); setFetching(false) })
  }, [token])

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Bidveda RFQ Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👤 {user?.name} (Buyer)</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-black">My RFQs</h2>
          <Link href="/rfqs/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Create RFQ
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: rfqs.length, color: 'blue' },
            { label: 'Draft', value: rfqs.filter(r => r.status === 'DRAFT').length, color: 'gray' },
            { label: 'Published', value: rfqs.filter(r => r.status === 'PUBLISHED').length, color: 'green' },
            { label: 'Awarded', value: rfqs.filter(r => r.status === 'AWARDED').length, color: 'purple' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* RFQ Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Quotes</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfqs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No RFQs yet. Create your first one!</td></tr>
              ) : rfqs.map(rfq => (
                <tr key={rfq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-black">{rfq.title}</td>
                  <td className="px-4 py-3 text-gray-500">{rfq.category}</td>
                  <td className="px-4 py-3 text-gray-500">{rfq.location}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(rfq.deadline).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rfq.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                      rfq.status === 'AWARDED' ? 'bg-purple-100 text-purple-700' :
                      rfq.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{rfq.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-black">{rfq._count?.quotes || 0}</td>
                  <td className="px-4 py-3">
                    <Link href={`/rfqs/${rfq.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}