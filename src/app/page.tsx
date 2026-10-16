import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Bidveda RFQ Portal</span>
        </div>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 py-20 text-center">
        <span className="bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1 rounded-full">
          Mini RFQ Portal
        </span>
        <h1 className="mt-6 text-5xl font-bold text-gray-900 leading-tight">
          Streamline Your <br />
          <span className="text-blue-600">Procurement Process</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
          A modern Request for Quotation platform connecting Buyers and Vendors.
          Create RFQs, collect quotes, compare and award — all in one place.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
          >
            Get Started →
          </Link>
          <a
            href="#features"
            className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-lg border border-gray-200"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Roles */}
      <section id="features" className="max-w-5xl mx-auto px-8 pb-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Three Roles, One Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Buyer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Buyer</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>✅ Create & publish RFQs</li>
              <li>✅ Attach specification files</li>
              <li>✅ Compare vendor quotes</li>
              <li>✅ Award RFQ to best vendor</li>
            </ul>
          </div>

          {/* Vendor */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🏭</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Vendor</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>✅ Browse open RFQs</li>
              <li>✅ Submit & revise quotes</li>
              <li>✅ Attach supporting docs</li>
              <li>✅ Track quote status</li>
            </ul>
          </div>

          {/* Admin */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Admin</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>✅ Manage all users</li>
              <li>✅ View all RFQs & quotes</li>
              <li>✅ Monitor platform activity</li>
              <li>✅ Full access control</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Test Credentials */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">🔑 Test Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: 'Admin', email: 'admin@bidveda.com', color: 'purple' },
              { role: 'Buyer', email: 'buyer@bidveda.com', color: 'blue' },
              { role: 'Vendor 1', email: 'vendor1@bidveda.com', color: 'green' },
              { role: 'Vendor 2', email: 'vendor2@bidveda.com', color: 'orange' },
            ].map((cred) => (
              <div key={cred.role} className="bg-gray-50 rounded-xl p-4 text-center">
                <span className="text-sm font-semibold text-gray-700 block mb-1">{cred.role}</span>
                <span className="text-xs text-gray-500 block">{cred.email}</span>
                <span className="text-xs text-gray-400 block mt-1">password@123</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Try the Portal →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-200">
        Bidveda RFQ Portal — Built as a technical assignment
      </footer>
    </div>
  )
}