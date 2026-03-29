import { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

const EVENT_TYPES = ["Wedding", "Reception", "Engagement", "Birthday", "Corporate", "Other"];

export default function Booking() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: packages } = useQuery("packages", () =>
    api.get("/packages").then(r => r.data.packages)
  );

  const [form, setForm] = useState({
    eventDate:      "",
    eventType:      "",
    package:        "",
    guestCount:     "",
    specialRequests:"",
    contactName:    user?.name  || "",
    contactPhone:   user?.phone || "",
    contactEmail:   user?.email || "",
  });

  const selectedPkg = packages?.find(p => p._id === form.package);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error("Please login to book"); return navigate("/login"); }
    if (!form.package) return toast.error("Please select a package");

    setLoading(true);
    try {
      await api.post("/bookings", {
        ...form,
        totalAmount: selectedPkg?.price || 0,
      });
      toast.success("Booking request submitted! We'll confirm soon.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gray-900 text-white py-16 text-center">
        <p className="section-subtitle text-gold">Reserve Your Date</p>
        <h1 className="section-title text-white">Book The Lawn</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!isLoggedIn && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
              Please <a href="/login" className="font-semibold underline">login</a> or{" "}
              <a href="/register" className="font-semibold underline">register</a> to complete your booking.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Details */}
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-800 mb-4 pb-2 border-b">Event Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                  <input
                    type="date" name="eventDate" value={form.eventDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={handleChange} required className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                  <select name="eventType" value={form.eventType} onChange={handleChange} required className="input-field">
                    <option value="">Select event type</option>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests *</label>
                  <input
                    type="number" name="guestCount" value={form.guestCount}
                    min="1" max="5000" onChange={handleChange} required
                    placeholder="Expected guests" className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Package Selection */}
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-800 mb-4 pb-2 border-b">Select Package *</h2>
              {!packages ? (
                <p className="text-sm text-gray-400">Loading packages...</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <label key={pkg._id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all
                        ${form.package === pkg._id ? "border-gold bg-gold/5" : "border-gray-200 hover:border-gold/50"}`}
                    >
                      <input type="radio" name="package" value={pkg._id}
                        checked={form.package === pkg._id}
                        onChange={handleChange} className="hidden"
                      />
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-800">{pkg.name}</span>
                        <span className="text-gold font-bold">₹{pkg.price.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-xs text-gray-500">{pkg.capacity.min}–{pkg.capacity.max} guests</p>
                      <ul className="mt-2 space-y-1">
                        {pkg.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-xs text-gray-500">• {f}</li>
                        ))}
                      </ul>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-800 mb-4 pb-2 border-b">Contact Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "Contact Name",  name: "contactName",  type: "text",  placeholder: "Full name" },
                  { label: "Phone Number",  name: "contactPhone", type: "tel",   placeholder: "+91 XXXXX XXXXX" },
                  { label: "Email Address", name: "contactEmail", type: "email", placeholder: "you@example.com" },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
                    <input
                      type={type} name={name} value={form[name]}
                      onChange={handleChange} required
                      placeholder={placeholder} className="input-field"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea
                name="specialRequests" value={form.specialRequests}
                onChange={handleChange} rows={3}
                placeholder="Any special arrangements, dietary needs, etc."
                className="input-field resize-none"
              />
            </div>

            {/* Summary */}
            {selectedPkg && (
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Package:</span> {selectedPkg.name} &nbsp;|&nbsp;
                  <span className="font-semibold">Amount:</span>{" "}
                  <span className="text-gold font-bold">₹{selectedPkg.price.toLocaleString("en-IN")}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Final amount may vary based on additional services.</p>
              </div>
            )}

            <button type="submit" disabled={loading || !isLoggedIn}
              className="btn-gold w-full py-4 text-base rounded-xl disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Booking Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
