import { useState } from "react";
import { useQuery } from "react-query";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const EVENT_TYPES = ["Wedding", "Reception", "Engagement", "Birthday", "Corporate", "Other"];

export default function Booking() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: packages } = useQuery("packages", () =>
    api.get("/packages").then(r => r.data.packages)
  );

  const { data: bookedDatesData } = useQuery("bookedDates", () =>
    api.get("/bookings/booked-dates").then(r => r.data.dates)
  );
  const bookedDates = bookedDatesData || [];

  // Timezone fix — UTC se local time mein convert
  const bookedDateObjects = bookedDates.map(d => {
    const [year, month, day] = d.split("-").map(Number);
    return new Date(year, month - 1, day);
  });

  const [form, setForm] = useState({
    eventDate:       "",
    eventType:       "",
    package:         "",
    guestCount:      "",
    specialRequests: "",
    contactName:     user?.name  || "",
    contactPhone:    user?.phone || "",
    contactEmail:    user?.email || "",
  });

  const selectedPkg = packages?.find(p => p._id === form.package);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.eventDate)    return toast.error("Please select an event date");
    if (!form.package)      return toast.error("Please select a package");
    if (!form.contactName)  return toast.error("Please enter your name");
    if (!form.contactPhone) return toast.error("Please enter your phone number");

    setLoading(true);
    try {
      await api.post("/bookings", {
        ...form,
        totalAmount: selectedPkg?.price || 0,
      });
      toast.success("Booking submitted! We'll confirm within 24 hours.");
      navigate(isLoggedIn ? "/dashboard" : "/");
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

          {/* Guest-friendly banner */}
          {!isLoggedIn && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-800 flex items-start gap-2">
              <span className="text-lg">✓</span>
              <div>
                <strong>No login required!</strong> Fill your details below and submit.
                
                <span className="block mt-1 text-xs text-green-600">
                  Already have an account?{" "}
                  <a href="/login" className="underline font-semibold">Login</a> to track bookings from your dashboard.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Event Details */}
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-800 mb-4 pb-2 border-b">Event Details</h2>
              <div className="grid md:grid-cols-2 gap-4">

                {/* Calendar — full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Event Date *</label>

                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <style>{`
                      .rdp { margin: 0; padding: 16px; font-family: inherit; }
                      .rdp-month { width: 100%; }
                      .rdp-table { width: 100%; }
                      .rdp-head_cell { color: #9ca3af; font-size: 12px; font-weight: 600; padding-bottom: 8px; }
                      .rdp-cell { padding: 2px; }
                      .rdp-button { width: 38px; height: 38px; border-radius: 8px; font-size: 13px; }
                      .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background: #fef9ee; color: #b45309; }
                      .rdp-day_selected, .rdp-day_selected:hover { background: #c9a96e !important; color: white !important; border-radius: 8px; }
                      .rdp-day_disabled { opacity: 0.35; cursor: not-allowed; }
                      .rdp-day_booked { background: #fee2e2 !important; color: #dc2626 !important; text-decoration: line-through; border-radius: 8px; }
                      .rdp-nav_button { color: #c9a96e; }
                      .rdp-caption_label { font-size: 15px; font-weight: 600; color: #1f2937; }
                    `}</style>

                    <DayPicker
                      mode="single"
                      selected={form.eventDate ? (() => {
                        const [y, m, d] = form.eventDate.split("-").map(Number);
                        return new Date(y, m - 1, d);
                      })() : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                        if (bookedDates.includes(iso)) {
                          toast.error("This date is already booked! Please choose another date.");
                          return;
                        }
                        setForm({ ...form, eventDate: iso });
                      }}
                      disabled={[
                        { before: new Date() },
                        ...bookedDateObjects,
                      ]}
                      modifiers={{ booked: bookedDateObjects }}
                      modifiersClassNames={{ booked: "rdp-day_booked" }}
                    />
                  </div>

                  {/* Selected date + legend */}
                  <div className="flex items-center justify-between mt-3 px-1">
                    {form.eventDate ? (
                      <p className="text-sm font-semibold text-amber-700">
                        ✓ Selected: {new Date(
                          ...form.eventDate.split("-").map((n, i) => i === 1 ? n - 1 : +n)
                        ).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No date selected</p>
                    )}
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 bg-red-200 rounded-sm border border-red-300"></span>
                      Already booked
                    </p>
                  </div>
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                  <select name="eventType" value={form.eventType} onChange={handleChange} required className="input-field">
                    <option value="">Select event type</option>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Guest Count */}
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
              <h2 className="text-lg font-serif font-bold text-gray-800 mb-4 pb-2 border-b">Your Contact Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="contactName" value={form.contactName}
                    onChange={handleChange} required placeholder="enter your full name " className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" name="contactPhone" value={form.contactPhone}
                    onChange={handleChange} required placeholder="+91 " className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-gray-400 font-normal">*</span>
                  </label>
                  <input type="email" name="contactEmail" value={form.contactEmail}
                    onChange={handleChange} placeholder="you@example.com" className="input-field" />
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea name="specialRequests" value={form.specialRequests}
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

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-4 text-base rounded-xl disabled:opacity-60">
              {loading ? "Submitting..." : "Submit Booking Request"}
            </button>

            <p className="text-center text-xs text-gray-400">
              Our team will contact you soon.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}