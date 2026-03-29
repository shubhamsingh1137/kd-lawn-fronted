import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Modal } from "../components/ui/index";
import ChangePasswordForm from "../components/ui/ChangePasswordForm";
import { FaCalendarAlt, FaUser, FaLock, FaPlus } from "react-icons/fa";

const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  completed: "bg-blue-100 text-blue-700",
};

const TABS = [
  { key: "bookings", label: "My Bookings",     icon: <FaCalendarAlt /> },
  { key: "profile",  label: "Edit Profile",    icon: <FaUser /> },
  { key: "password", label: "Change Password", icon: <FaLock /> },
];

export default function UserDashboard() {
  const { user }          = useAuth();
  const qc                = useQueryClient();
  const [tab, setTab]     = useState("bookings");
  const [cancelId, setCancelId] = useState(null);
  const [profile, setProfile]   = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [saving, setSaving]     = useState(false);

  const { data: bookings, isLoading } = useQuery("myBookings", () =>
    api.get("/bookings/my").then(r => r.data.bookings)
  );

  const handleCancelBooking = async () => {
    try {
      await api.patch(`/bookings/${cancelId}/cancel`);
      toast.success("Booking cancelled");
      qc.invalidateQueries("myBookings");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot cancel");
    } finally {
      setCancelId(null);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/profile", profile);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-gray-800">{user?.name}</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <Link to="/booking"
            className="btn-gold text-sm py-2.5 px-5 rounded-xl flex items-center gap-2 self-start sm:self-auto">
            <FaPlus size={12}/> New Booking
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl shadow-sm p-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-1 transition-colors
                ${tab === t.key ? "bg-gold text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Bookings tab ── */}
        {tab === "bookings" && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gold rounded-full animate-spin"/>
              </div>
            ) : !bookings?.length ? (
              <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-gray-400 mb-4">No bookings yet. Book your special day!</p>
                <Link to="/booking" className="btn-gold">Book Now</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b._id} className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="font-semibold text-gray-800 text-lg">{b.eventType}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[b.status]}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Date",    value: new Date(b.eventDate).toDateString() },
                            { label: "Package", value: b.package?.name || "—" },
                            { label: "Guests",  value: b.guestCount },
                            { label: "Amount",  value: `₹${b.totalAmount?.toLocaleString("en-IN")}` },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                              <p className="font-medium text-gray-800 text-sm mt-0.5">{value}</p>
                            </div>
                          ))}
                        </div>
                        {b.specialRequests && (
                          <p className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                            <strong>Special requests:</strong> {b.specialRequests}
                          </p>
                        )}
                        {b.adminNote && (
                          <p className="mt-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                            <strong>Admin note:</strong> {b.adminNote}
                          </p>
                        )}
                      </div>
                      {b.status === "pending" && (
                        <button onClick={() => setCancelId(b._id)}
                          className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors shrink-0">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Profile tab ── */}
        {tab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Edit Profile</h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  required className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  required className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" value={user?.email} disabled
                  className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>
              <button type="submit" disabled={saving}
                className="btn-gold py-3 px-8 rounded-xl disabled:opacity-60">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* ── Password tab ── */}
        {tab === "password" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Change Password</h2>
            <ChangePasswordForm />
          </div>
        )}
      </div>

      {/* Cancel confirm modal */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Booking" maxWidth="max-w-sm">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to cancel this booking? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleCancelBooking}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">
            Yes, Cancel
          </button>
          <button onClick={() => setCancelId(null)}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200">
            Keep Booking
          </button>
        </div>
      </Modal>
    </div>
  );
}
