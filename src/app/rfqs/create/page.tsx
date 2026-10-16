"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface LineItem {
  name: string;
  quantity: string;
  unit: string;
}

export default function CreateRFQ() {
  const { token, user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    budget: "",
    deadline: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: "", quantity: "", unit: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string,
  ) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const addLineItem = () =>
    setLineItems([...lineItems, { name: "", quantity: "", unit: "" }]);
  const removeLineItem = (index: number) =>
    setLineItems(lineItems.filter((_, i) => i !== index));

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

    if (res.ok) {
      setAttachments((prev) => [...prev, data.url]);
    } else {
      setError(data.error || "Upload failed");
    }
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/rfqs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...form, status, lineItems, attachments }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to create RFQ");
      return;
    }

    router.push("/dashboard/buyer");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user || user.role !== "BUYER") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Bidveda RFQ Portal</h1>
        <button
          onClick={() => router.push("/dashboard/buyer")}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-black mb-6">Create New RFQ</h2>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border text-black rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Office Supplies for Hyderabad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border text-black rounded-lg px-3 py-2 text-sm h-24"
              placeholder="Describe your requirements..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border text-black  rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Furniture, Electronics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border text-black rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Hyderabad"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (₹) Optional
              </label>
              <input
                name="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
                className="w-full border text-black rounded-lg px-3 py-2 text-sm"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submission Deadline *
              </label>
              <input
                name="deadline"
                type="datetime-local"
                value={form.deadline}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Attach Specification Files (PDF/XLSX)
              </label>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls"
                onChange={handleFileUpload}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
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
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">
                Line Items *
              </label>
              <button
                onClick={addLineItem}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) =>
                      handleLineItemChange(index, "name", e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 text-sm text-black flex-1"
                  />
                  <input
                    placeholder="Qty"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleLineItemChange(index, "quantity", e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 text-sm text-black w-24"
                  />
                  <input
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) =>
                      handleLineItemChange(index, "unit", e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 text-sm w-24 text-black"
                  />
                  {lineItems.length > 1 && (
                    <button
                      onClick={() => removeLineItem(index)}
                      className="text-red-400 hover:text-red-600 text-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleSubmit("DRAFT")}
              disabled={submitting}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish RFQ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
