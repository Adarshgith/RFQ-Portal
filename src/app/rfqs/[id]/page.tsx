"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RFQDetail({ params }: { params: { id: string } }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [rfq, setRfq] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const fetchRFQ = () => {
    if (!token) return;
    fetch(`/api/rfqs/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setRfq(d.rfq);
        setFetching(false);
      });
  };

  useEffect(() => {
    if (!loading) fetchRFQ();
  }, [token, loading]);

  const handlePublish = async () => {
    setPublishing(true);
    const res = await fetch(`/api/rfqs/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    setPublishing(false);
    if (res.ok) fetchRFQ();
  };

  const handleClose = async () => {
    const res = await fetch(`/api/rfqs/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    if (res.ok) fetchRFQ();
  };

  const handleAward = async (quoteId: string) => {
    const res = await fetch(`/api/quotes/${quoteId}/award`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchRFQ();
    else {
      const d = await res.json();
      setError(d.error);
    }
  };

  if (loading || fetching)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-900">
        Loading...
      </div>
    );
  if (!rfq)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-900">
        RFQ not found
      </div>
    );

  const isDeadlinePassed = new Date() > new Date(rfq.deadline);
  const canSubmitQuote =
    user?.role === "VENDOR" && rfq.status === "PUBLISHED" && !isDeadlinePassed;
  const vendorQuote = rfq.quotes?.find((q: any) => q.vendorId === user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Bidveda RFQ Portal</h1>
        <button
          onClick={() =>
            router.push(
              user?.role === "BUYER" ? "/dashboard/buyer" : "/dashboard/vendor",
            )
          }
          className="text-sm text-gray-700 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded">
            {error}
          </div>
        )}

        {/* RFQ Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{rfq.title}</h2>
              <p className="text-gray-700 mt-2">{rfq.description}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                rfq.status === "PUBLISHED"
                  ? "bg-green-100 text-green-700"
                  : rfq.status === "AWARDED"
                    ? "bg-purple-100 text-purple-700"
                    : rfq.status === "CLOSED"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {rfq.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <div>
              <p className="text-xs text-gray-500 uppercase">Category</p>
              <p className="text-gray-900 font-medium">{rfq.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Location</p>
              <p className="text-gray-900 font-medium">{rfq.location}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Deadline</p>
              <p
                className={`font-medium ${isDeadlinePassed ? "text-red-600" : "text-gray-900"}`}
              >
                {new Date(rfq.deadline).toLocaleString()}
                {isDeadlinePassed && " (Passed)"}
              </p>
            </div>
            {rfq.budget && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Budget</p>
                <p className="text-gray-900 font-medium">
                  ₹{rfq.budget.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Buyer Actions */}
          {user?.role === "BUYER" && rfq.buyerId === user.id && (
            <div className="flex gap-3 mt-5">
              {rfq.status === "DRAFT" && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {publishing ? "Publishing..." : "Publish RFQ"}
                </button>
              )}
              {rfq.status === "PUBLISHED" && (
                <button
                  onClick={handleClose}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
                >
                  Close RFQ
                </button>
              )}
              {rfq.status === "PUBLISHED" && (
                <Link
                  href={`/rfqs/${params.id}/compare`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  Compare Quotes
                </Link>
              )}
              {rfq.status === "CLOSED" && (
                <Link
                  href={`/rfqs/${params.id}/compare`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  Compare & Award
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Line Items
          </h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfq.lineItems?.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-2 text-gray-700">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vendor: Submit Quote */}
        {user?.role === "VENDOR" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {vendorQuote ? "Your Submitted Quote" : "Submit a Quote"}
            </h3>
            {!canSubmitQuote && !vendorQuote && (
              <p className="text-red-600 text-sm">
                {isDeadlinePassed
                  ? "Deadline has passed."
                  : "RFQ is not open for quotes."}
              </p>
            )}
            {vendorQuote && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-gray-900 font-medium">
                  Total: ₹{vendorQuote.totalPrice?.toLocaleString()}
                </p>
                <p className="text-gray-700 text-sm">
                  Delivery: {vendorQuote.deliveryDays} days
                </p>
                <p className="text-gray-700 text-sm">
                  Status:{" "}
                  <span className="font-medium">{vendorQuote.status}</span>
                </p>
                {vendorQuote.attachments?.length > 0 && (
                  <div>
                    <p className="text-gray-900 text-sm font-medium mt-2">
                      Attachments:
                    </p>
                    {vendorQuote.attachments.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        📎 {url.split("/").pop()}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            {canSubmitQuote && (
              <Link
                href={`/rfqs/${params.id}/quote`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                {vendorQuote ? "Revise Quote" : "Submit Quote"}
              </Link>
            )}
          </div>
        )}

        {/* Buyer: Quotes Summary */}
        {user?.role === "BUYER" && rfq.quotes?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quotes Received ({rfq.quotes.length})
            </h3>
            <div className="space-y-3">
              {rfq.quotes.map((quote: any) => (
                <div
                  key={quote.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-900 font-medium">
                      {quote.vendor?.name} — {quote.vendor?.company}
                    </p>
                    <p className="text-gray-700 text-sm">
                      ₹{quote.totalPrice?.toLocaleString()} ·{" "}
                      {quote.deliveryDays} days delivery
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        quote.status === "ACCEPTED"
                          ? "bg-green-100 text-green-700"
                          : quote.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {quote.status}
                    </span>
                    {rfq.status === "CLOSED" &&
                      quote.status === "SUBMITTED" && (
                        <button
                          onClick={() => handleAward(quote.id)}
                          className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-purple-700"
                        >
                          Award
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
