import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Modal } from "../components/ui/index";
import ChangePasswordForm from "../components/ui/ChangePasswordForm";
import { FaCalendarAlt, FaUser, FaLock, FaPlus, FaFileDownload, FaCreditCard } from "react-icons/fa";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("bookings");
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

  const handleDownloadBill = (booking) => {
  const billWindow = window.open("", "_blank");

  if (!billWindow) {
    toast.error("Please allow pop-ups to download the bill");
    return;
  }

  const totalAmount = Number(booking.totalAmount || 0);
  const advanceAmount = Number(booking.advanceAmount || 0);
  const remainingAmount = Math.max(
    totalAmount - advanceAmount,
    0
  );

  billWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Booking Bill - ${booking._id}</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f7f3e8;
          margin: 0;
          padding: 40px;
          color: #222;
        }

        .invoice {
          max-width: 800px;
          margin: auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
        }

        .header {
          background: #111827;
          color: white;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 30px;
        }

        .header h1 {
          margin: 0;
        }

        .header p {
          margin: 5px 0 0;
          color: #ddd;
        }

        .section {
          margin-top: 25px;
        }

        .section h3 {
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
        }

        .total {
          font-size: 20px;
          font-weight: bold;
        }

        .remaining {
          color: #d97706;
          font-size: 20px;
          font-weight: bold;
        }

        .paid {
          color: #16a34a;
          font-weight: bold;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          color: #777;
          font-size: 13px;
        }

        .print-btn {
          display: block;
          margin: 25px auto;
          padding: 12px 25px;
          background: #b8860b;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        @media print {
          .print-btn {
            display: none;
          }

          body {
            background: white;
            padding: 0;
          }
        }
      </style>
    </head>

    <body>

      <div class="invoice">

        <div class="header">
          <h1>KD UTSAV LAWN</h1>
          <p>Kalawati Devi Utsav Lawn</p>
          <p>Booking Payment Receipt</p>
        </div>

        <div class="section">
          <h3>Customer Details</h3>

          <div class="row">
            <span>Name</span>
            <strong>${booking.contactName || user?.name || "-"}</strong>
          </div>

          <div class="row">
            <span>Phone</span>
            <strong>${booking.contactPhone || user?.phone || "-"}</strong>
          </div>

          <div class="row">
            <span>Email</span>
            <strong>${booking.contactEmail || user?.email || "-"}</strong>
          </div>
        </div>

        <div class="section">
          <h3>Booking Details</h3>

          <div class="row">
            <span>Booking ID</span>
            <strong>${booking._id}</strong>
          </div>

          <div class="row">
            <span>Event</span>
            <strong>${booking.eventType}</strong>
          </div>

          <div class="row">
            <span>Event Date</span>
            <strong>${new Date(booking.eventDate).toDateString()}</strong>
          </div>

          <div class="row">
            <span>Package</span>
            <strong>${booking.package?.name || "-"}</strong>
          </div>

          <div class="row">
            <span>Guests</span>
            <strong>${booking.guestCount}</strong>
          </div>

          <div class="row">
            <span>Booking Status</span>
            <strong>${booking.status || "-"}</strong>
          </div>
        </div>

        <div class="section">
          <h3>Payment Details</h3>

          <div class="row total">
            <span>Total Bill</span>
            <span>₹${totalAmount.toLocaleString("en-IN")}</span>
          </div>

          <div class="row paid">
            <span>Advance Paid</span>
            <span>₹${advanceAmount.toLocaleString("en-IN")}</span>
          </div>

          <div class="row remaining">
            <span>Remaining Amount</span>
            <span>₹${remainingAmount.toLocaleString("en-IN")}</span>
          </div>

          <div class="row">
            <span>Payment Status</span>
            <strong>${booking.paymentStatus || "unpaid"}</strong>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing KD Utsav Lawn.</p>
          <p>This is a computer generated booking receipt.</p>
        </div>

      </div>

      <button class="print-btn" onclick="window.print()">
        Download / Save as PDF
      </button>

    </body>
    </html>
  `);

  billWindow.document.close();
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
                {bookings.map((b) => {

  const totalAmount = Number(b.totalAmount || 0);
  const advanceAmount = Number(b.advanceAmount || 0);

  const remainingAmount = Math.max(
    totalAmount - advanceAmount,
    0
  );

  const isConfirmed =
    String(b.status || "").toLowerCase() === "confirmed";

  const isFullyPaid =
    remainingAmount === 0 ||
    b.paymentStatus === "fully_paid";

  return (
    <div
      key={b._id}
      className="bg-white rounded-2xl shadow-sm p-6"
    >

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

        <div className="flex-1">

          <div className="flex flex-wrap items-center gap-3 mb-4">

            <h3 className="font-semibold text-gray-800 text-lg">
              {b.eventType}
            </h3>

            <span
              className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                STATUS_COLORS[b.status] ||
                "bg-gray-100 text-gray-500"
              }`}
            >
              {b.status}
            </span>

          </div>

          {/* BOOKING DETAILS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Date
              </p>

              <p className="font-medium text-gray-800 text-sm mt-1">
                {new Date(b.eventDate).toDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Package
              </p>

              <p className="font-medium text-gray-800 text-sm mt-1">
                {b.package?.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Guests
              </p>

              <p className="font-medium text-gray-800 text-sm mt-1">
                {b.guestCount}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Booking ID
              </p>

              <p className="font-medium text-gray-800 text-sm mt-1">
                #{b._id.slice(-8).toUpperCase()}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* PAYMENT SUMMARY */}
      <div className="mt-6 border-t pt-5">

        <h4 className="font-semibold text-gray-800 mb-4">
          Payment Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* TOTAL */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">
              Total Bill
            </p>

            <p className="text-lg font-bold text-gray-800 mt-1">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* ADVANCE */}
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-green-600 uppercase">
              Advance Paid
            </p>

            <p className="text-lg font-bold text-green-700 mt-1">
              ₹{advanceAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* REMAINING */}
          <div
            className={`rounded-xl p-4 ${
              remainingAmount > 0
                ? "bg-orange-50"
                : "bg-green-50"
            }`}
          >
            <p
              className={`text-xs uppercase ${
                remainingAmount > 0
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            >
              Remaining Amount
            </p>

            <p
              className={`text-lg font-bold mt-1 ${
                remainingAmount > 0
                  ? "text-orange-700"
                  : "text-green-700"
              }`}
            >
              ₹{remainingAmount.toLocaleString("en-IN")}
            </p>
          </div>

        </div>

        {/* PAYMENT STATUS */}
        <div className="mt-4 flex flex-wrap items-center gap-3">

          <span className="text-sm text-gray-500">
            Payment Status:
          </span>

          <span
            className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
              isFullyPaid
                ? "bg-green-100 text-green-700"
                : advanceAmount > 0
                ? "bg-blue-100 text-blue-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {isFullyPaid
              ? "Fully Paid"
              : advanceAmount > 0
              ? "Advance Paid"
              : "Payment Pending"}
          </span>

        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-5 pt-5 border-t flex flex-wrap gap-3">

        {/* DOWNLOAD BILL */}
        <button
          onClick={() => handleDownloadBill(b)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          <FaFileDownload />
          Download Bill
        </button>

        {/* PAY REMAINING */}
        {isConfirmed && remainingAmount > 0 && (
          <button
            onClick={() => navigate(`/pay/${b._id}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:opacity-90"
          >
            <FaCreditCard />
            Pay Remaining ₹{remainingAmount.toLocaleString("en-IN")}
          </button>
        )}

        {/* FULLY PAID */}
        {isConfirmed && isFullyPaid && (
          <span className="flex items-center px-4 py-2.5 rounded-xl bg-green-100 text-green-700 text-sm font-semibold">
            ✓ Payment Completed
          </span>
        )}

        {/* CANCEL */}
        {b.status === "pending" && (
          <button
            onClick={() => setCancelId(b._id)}
            className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
        )}

      </div>

    </div>
  );
})}
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
