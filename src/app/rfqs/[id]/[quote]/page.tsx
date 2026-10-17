"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SubmitQuote({ params }: { params: { id: string } }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [rfq, setRfq] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [notes, setNotes] = useState("");
  const [prices, setPrices] = useState<{ [key: string]: string }>({});
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "VENDOR")) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/rfqs/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setRfq(d.rfq);
        setFetching(false);

        // Pre-fill if vendor already has a quote
        const existing = d.rfq?.quotes?.[0];
        if (existing) {
          setDeliveryDays(existing.deliveryDays.toString());
          setNotes(existing.notes || "");
          const p: { [key: string]: string } = {};
          existing.quoteItems?.forEach((qi: any) => {
            p[qi.lineItemId] = qi.unitPrice.toString();
          });
          setPrices(p);
        }
      });
  }, [token]);

  //FileHandler

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (res.ok) setAttachments((prev) => [...prev, data.url]);
    else setError(data.error || "Upload failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const quoteItems = rfq.lineItems.map((item: any) => ({
      lineItemId: item.id,
      unitPrice: prices[item.id] || "0",
    }));

    const res = await fetch(`/api/rfqs/${params.id}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deliveryDays: parseInt(deliveryDays),
        notes,
        quoteItems,
        attachments,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to submit quote");
      return;
    }

    router.push(`/rfqs/${params.id}`);
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

  const totalPrice = rfq.lineItems?.reduce((sum: number, item: any) => {
    return sum + parseFloat(prices[item.id] || "0") * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Bidveda RFQ Portal</h1>
        <button
          onClick={() => router.push(`/rfqs/${params.id}`)}
          className="text-sm text-gray-700 hover:underline"
        >
          ← Back to RFQ
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Quote</h2>
        <p className="text-gray-700 mb-6">RFQ: {rfq.title}</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 space-y-5"
        >
          {/* Line Item Prices */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">
              Price per Line Item
            </h3>
            <div className="space-y-3">
              {rfq.lineItems?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-900 font-medium">{item.name}</p>
                    <p className="text-gray-700 text-sm">
                      Qty: {item.quantity} {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-sm">₹</span>
                    <input
                      type="number"
                      placeholder="Unit price"
                      value={prices[item.id] || ""}
                      onChange={(e) =>
                        setPrices({ ...prices, [item.id]: e.target.value })
                      }
                      className="border rounded-lg px-3 py-2 text-sm w-32 text-gray-900"
                      required
                    />
                    {prices[item.id] && (
                      <span className="text-gray-700 text-sm whitespace-nowrap">
                        = ₹
                        {(
                          parseFloat(prices[item.id]) * item.quantity
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex justify-between">
              <span className="text-gray-900 font-semibold">
                Total Quote Value
              </span>
              <span className="text-blue-700 font-bold">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Delivery Days */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Delivery Days *
            </label>
            <input
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-black"
              placeholder="e.g. 7"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-black h-24"
              placeholder="Any additional notes..."
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Attach Documents (PDF/XLSX)
            </label>
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full border rounded-lg px-3 py-2 text-sm text-black"
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-1">Uploading...</p>
            )}
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <a
                      href={url}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      📎 {url.split("/").pop()}
                    </a>
                    <button
                      onClick={() =>
                        setAttachments(
                          attachments.filter((_, idx) => idx !== i),
                        )
                      }
                      className="text-red-400 text-xs hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Quote"}
          </button>
        </form>
      </div>
    </div>
  );
}
