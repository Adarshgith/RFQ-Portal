'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function CompareQuotes({ params }: { params: { id: string } }) {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [rfq, setRfq] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [sortBy, setSortBy] = useState<'totalPrice' | 'deliveryDays'>('totalPrice')
  const [awarding, setAwarding] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'BUYER')) router.push('/login')
  }, [user, loading])

  const fetchData = () => {
    if (!token) return
    Promise.all([
      fetch(`/api/rfqs/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/rfqs/${params.id}/quotes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([rfqData, quotesData]) => {
      setRfq(rfqData.rfq)
      setQuotes(quotesData.quotes || [])
      setFetching(false)
    })
  }

  useEffect(() => { if (!loading) fetchData() }, [token, loading])

  const handleAward = async (quoteId: string) => {
    if (!confirm('Are you sure you want to award this quote? This cannot be undone.')) return
    setAwarding(quoteId)
    setError('')

    const res = await fetch(`/api/quotes/${quoteId}/award`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    setAwarding(null)

    if (!res.ok) { setError(data.error || 'Failed to award'); return }
    fetchData()
  }

  const sortedQuotes = [...quotes].sort((a, b) => a[sortBy] - b[sortBy])

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center text-gray-900">Loading...</div>
  if (!rfq) return <div className="min-h-screen flex items-center justify-center text-gray-900">RFQ not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Bidveda RFQ Portal</h1>
        <button onClick={() => router.push(`/rfqs/${params.id}`)} className="text-sm text-gray-700 hover:underline">
          ← Back to RFQ
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Compare Quotes</h2>
            <p className="text-gray-700 mt-1">{rfq.title}</p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Sort by:</span>
            <button
              onClick={() => setSortBy('totalPrice')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${sortBy === 'totalPrice' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              Total Price
            </button>
            <button
              onClick={() => setSortBy('deliveryDays')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${sortBy === 'deliveryDays' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              Delivery Days
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4">{error}</div>}

        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-700">
            No quotes received yet.
          </div>
        ) : (
          <>
            {/* Comparison Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    {rfq.lineItems?.map((item: any) => (
                      <th key={item.id} className="px-4 py-3 text-left">{item.name} (x{item.quantity})</th>
                    ))}
                    <th className="px-4 py-3 text-left">Total Price</th>
                    <th className="px-4 py-3 text-left">Delivery</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    {rfq.status === 'CLOSED' && <th className="px-4 py-3 text-left">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedQuotes.map((quote, index) => {
                    const isLowest = index === 0 && sortBy === 'totalPrice'
                    const isFastest = index === 0 && sortBy === 'deliveryDays'

                    return (
                      <tr key={quote.id} className={`hover:bg-gray-50 ${
                        quote.status === 'ACCEPTED' ? 'bg-green-50' :
                        quote.status === 'REJECTED' ? 'bg-red-50 opacity-60' : ''
                      }`}>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 font-medium">{quote.vendor?.name}</p>
                          <p className="text-gray-700 text-xs">{quote.vendor?.company}</p>
                          {isLowest && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Lowest</span>}
                          {isFastest && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Fastest</span>}
                        </td>

                        {rfq.lineItems?.map((item: any) => {
                          const qi = quote.quoteItems?.find((q: any) => q.lineItemId === item.id)
                          return (
                            <td key={item.id} className="px-4 py-3 text-gray-900">
                              {qi ? (
                                <div>
                                  <p className="font-medium">₹{qi.unitPrice?.toLocaleString()}/unit</p>
                                  <p className="text-gray-700 text-xs">= ₹{qi.totalPrice?.toLocaleString()}</p>
                                </div>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                          )
                        })}

                        <td className="px-4 py-3 font-bold text-gray-900">
                          ₹{quote.totalPrice?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{quote.deliveryDays} days</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            quote.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{quote.status}</span>
                        </td>
                        {rfq.status === 'CLOSED' && (
                          <td className="px-4 py-3">
                            {quote.status === 'SUBMITTED' && (
                              <button
                                onClick={() => handleAward(quote.id)}
                                disabled={awarding === quote.id}
                                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-purple-700 disabled:opacity-50"
                              >
                                {awarding === quote.id ? 'Awarding...' : 'Award'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {rfq.status === 'PUBLISHED' && (
              <p className="text-gray-700 text-sm text-center">
                Close the RFQ first to award a vendor.
              </p>
            )}
            {rfq.status === 'AWARDED' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-medium">✅ This RFQ has been awarded!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}