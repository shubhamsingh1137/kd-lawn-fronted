import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

const STATUS_CONFIG = {
  pending:   { label: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed ✓",    color: "bg-green-100 text-green-800"   },
  rejected:  { label: "Rejected",       color: "bg-red-100 text-red-800"       },
  cancelled: { label: "Cancelled",      color: "bg-gray-100 text-gray-600"     },
  completed: { label: "Completed",      color: "bg-blue-100 text-blue-800"     },
};

// ── PDF Generator ─────────────────────────────────────────────
const generateBillPDF = (b) => {
  const doc = new jsPDF();
  const gold = [180, 140, 80];
  const dark = [30, 30, 30];
  const gray = [120, 120, 120];
  const W = 210;

  // Header background
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 38, "F");

  // Lawn name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("KD Utsav Lawn", W / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Kalawati Devi Utsav Lawn  |  Teachers colony Gayatri nagar road kunraghat, UP - 273008", W / 2, 23, { align: "center" });
  doc.text("+91 8808085237  |  kdutsavlawn@gmail.com", W / 2, 29, { align: "center" });

  // BOOKING RECEIPT title
  doc.setFillColor(245, 240, 230);
  doc.rect(0, 38, W, 12, "F");
  doc.setTextColor(...dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BOOKING RECEIPT", W / 2, 46, { align: "center" });

  // Booking ID & Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  const bookedOn = new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Booking ID: ${b._id?.slice(-8).toUpperCase()}`, 14, 58);
  doc.text(`Date: ${bookedOn}`, W - 14, 58, { align: "right" });

  // Divider
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(14, 62, W - 14, 62);

  // Customer Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("Customer Details", 14, 70);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  const details = [
    ["Name",         b.contactName],
    ["Phone",        b.contactPhone],
    ["Email",        b.contactEmail || "—"],
  ];
  details.forEach(([label, val], i) => {
    doc.text(label, 14, 78 + i * 7);
    doc.setTextColor(...dark);
    doc.text(val, 60, 78 + i * 7);
    doc.setTextColor(...gray);
  });

  // Event Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text("Event Details", 14, 108);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  const eventDate = new Date(b.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const eventDetails = [
    ["Event Type",  b.eventType],
    ["Event Date",  eventDate],
    ["Package",     b.package?.name || "—"],
    ["Guests",      `${b.guestCount} persons`],
  ];
  eventDetails.forEach(([label, val], i) => {
    doc.text(label, 14, 116 + i * 7);
    doc.setTextColor(...dark);
    doc.text(val, 60, 116 + i * 7);
    doc.setTextColor(...gray);
  });

  // Amount Table
  doc.setFillColor(245, 240, 230);
  doc.rect(14, 148, W - 28, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text("Description", 18, 154);
  doc.text("Amount", W - 18, 154, { align: "right" });

  doc.setFillColor(255, 255, 255);
  doc.rect(14, 156, W - 28, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.text(b.package?.name || "Event Package", 18, 162);
  doc.text(`Rs. ${b.totalAmount?.toLocaleString("en-IN")}`, W - 18, 162, { align: "right" });

  // Total
  doc.setDrawColor(...gold);
  doc.line(14, 166, W - 14, 166);
  doc.setFillColor(...gold);
  doc.rect(14, 166, W - 28, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Total Amount", 18, 173);
  doc.text(`Rs. ${b.totalAmount?.toLocaleString("en-IN")}`, W - 18, 173, { align: "right" });

  // Status
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(`Booking Status: ${b.status?.toUpperCase()}`, 14, 185);

  // Admin Note
  if (b.adminNote) {
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text("Note from Kalawati Lawn:", 14, 195);
    doc.setTextColor(...dark);
    const noteLines = doc.splitTextToSize(b.adminNote, W - 28);
    doc.text(noteLines, 14, 202);
  }

  // Special Requests
  if (b.specialRequests) {
    const yPos = b.adminNote ? 220 : 195;
    doc.setTextColor(...gray);
    doc.text("Special Requests:", 14, yPos);
    doc.setTextColor(...dark);
    const reqLines = doc.splitTextToSize(b.specialRequests, W - 28);
    doc.text(reqLines, 14, yPos + 7);
  }

  // Footer
  doc.setFillColor(...gold);
  doc.rect(0, 272, W, 25, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text("Thank you for choosing KD Utsav Lawn!", W / 2, 281, { align: "center" });
  doc.text("For queries: +91 8808085237  |  kdutsavlawn@gmail.com", W / 2, 287, { align: "center" });

  doc.save(`KD-Lawn-Booking-${b._id?.slice(-8).toUpperCase()}.pdf`);
};

// ── WhatsApp Share ────────────────────────────────────────────
const shareOnWhatsApp = (b) => {
  const eventDate = new Date(b.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const msg = `*KD Utsav Lawn - Booking Receipt*\n\n` +
    `Booking ID: ${b._id?.slice(-8).toUpperCase()}\n` +
    `Name: ${b.contactName}\n` +
    `Event: ${b.eventType}\n` +
    `Date: ${eventDate}\n` +
    `Package: ${b.package?.name || "—"}\n` +
    `Guests: ${b.guestCount}\n` +
    `Amount: Rs. ${b.totalAmount?.toLocaleString("en-IN")}\n` +
    `Status: ${b.status?.toUpperCase()}\n\n` +
    (b.adminNote ? `Message from Lawn: ${b.adminNote}\n\n` : "") +
    `Track your booking: ${window.location.origin}/track-booking`;

  const phone = b.contactPhone?.replace(/\D/g, "");
  window.open(`https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${encodeURIComponent(msg)}`, "_blank");
};

// ── Email Share ───────────────────────────────────────────────
const shareViaEmail = (b) => {
  const eventDate = new Date(b.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const subject = `KD Utsav Lawn - Booking Receipt (${b._id?.slice(-8).toUpperCase()})`;
  const body = `Dear ${b.contactName},\n\nYour booking details:\n\n` +
    `Booking ID: ${b._id?.slice(-8).toUpperCase()}\n` +
    `Event: ${b.eventType}\n` +
    `Date: ${eventDate}\n` +
    `Package: ${b.package?.name || "—"}\n` +
    `Guests: ${b.guestCount}\n` +
    `Amount: Rs. ${b.totalAmount?.toLocaleString("en-IN")}\n` +
    `Status: ${b.status?.toUpperCase()}\n\n` +
    (b.adminNote ? `Message from Kalawati Lawn:\n${b.adminNote}\n\n` : "") +
    `Track your booking anytime at: ${window.location.origin}/track-booking\n\n` +
    `Thank you for choosing KD Utsav Lawn!\n+91 8808085237`;

  window.open(`mailto:${b.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
};

// ── Main Component ────────────────────────────────────────────
export default function TrackBooking() {
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const { loginWithToken } = useAuth();
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [bookings, setBookings] = useState(null);
  const [billModal, setBillModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [qrPaymentModal, setQrPaymentModal] = useState(null);
  const [qrSubmitting, setQrSubmitting] = useState(false);


const handleSendOTP = async (e) => {
  e.preventDefault();

  const cleanEmail = email.trim().toLowerCase();

 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
  return toast.error("Please enter a valid email address");
}

  setLoading(true);

  try {
    const res = await api.post("/auth/send-otp", {
      email: cleanEmail,
    });

    setEmail(cleanEmail);
    setMaskedEmail(res.data.maskedEmail || cleanEmail);
    setOtpSent(true);

    toast.success("OTP sent to your booking email address");
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Unable to send OTP"
    );
  } finally {
    setLoading(false);
  }
};


const handleVerifyOTP = async (e) => {
  e.preventDefault();

  if (!otp || otp.length !== 6) {
    return toast.error("Please enter 6-digit OTP");
  }

  setLoading(true);

  try {
    // 1. Verify OTP using email
    const verifyRes = await api.post("/auth/verify-otp", {
      email: email.trim().toLowerCase(),
      otp,
    });

    // 2. Get token and user details from backend
    const { token, user } = verifyRes.data;

    if (!token || !user) {
      throw new Error(
        "Authentication token or user details not received"
      );
    }

    // 3. Save login in localStorage AND AuthContext
    loginWithToken(token, user);

    // 4. OTP verified successfully
    setOtpVerified(true);
    setOtp("");
    setOtpSent(false);

    toast.success("OTP verified successfully");

    // 5. Fetch bookings using the verified token
    const bookingRes = await api.get("/bookings/track", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userBookings = bookingRes.data.bookings || [];
    setBookings(userBookings);

    if (userBookings.length === 0) {
      toast("No bookings found.", {
        icon: "🔍",
      });
    }
  } catch (err) {
    toast.error(
      err.response?.data?.message ||
      err.message ||
      "OTP verification failed"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-gray-900 text-white py-16 text-center">
        <p className="section-subtitle text-gold">Check Your Status</p>
        <h1 className="section-title text-white">Track Your Booking</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">

       {/* Search / OTP box */}
{/* Search / OTP box */}
{!otpVerified && (
  <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">

    {!otpSent ? (
      <>
        <p className="text-sm text-gray-500 mb-4">
  Enter the email address you used when making your booking.
  We will send an OTP to that email address.
</p>
<form onSubmit={handleSendOTP} className="flex flex-col sm:flex-row gap-3">
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter your booking email"
    className="input-field flex-1 min-w-0"
    autoComplete="email"
    required
  />

  <button
    type="submit"
    disabled={loading}
    className="btn-gold px-6 rounded-xl"
  >
    {loading ? "Sending..." : "Send OTP"}
  </button>
</form>
      </>
    ) : (
      <>
        <p className="text-sm text-gray-500 mb-4">
          OTP has been sent to{" "}
          <strong>{maskedEmail}</strong>
        </p>

        <form
          onSubmit={handleVerifyOTP}
          className="space-y-4"
        >

          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            placeholder="Enter 6-digit OTP"
            className="input-field w-full text-center tracking-[0.5em] text-lg"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full rounded-xl py-3"
          >
            {loading
              ? "Verifying..."
              : "Verify OTP & View Booking"}
          </button>

        </form>

        <button
          type="button"
          onClick={() => {
            setOtpSent(false);
            setOtp("");
            setBookings(null);
          }}
          className="text-sm text-gray-500 hover:text-gray-800 mt-4"
        >
          ← Change email address
        </button>
      </>
    )}

  </div>
)}
        {/* Results */}
        {bookings !== null && (
          bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
              No bookings found for this email.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{bookings.length} booking(s) found</p>
              {bookings.map(b => {

  const s =
    STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;

  const eventDate =
    new Date(b.eventDate).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );

  const paidAmount = b.advanceAmount || 0;

  const remainingAmount = Math.max(
    (b.totalAmount || 0) - paidAmount,
    0
  );

  return (
                  <div key={b._id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">{b.eventType}</p>
                        <p className="text-sm text-gray-500">{b.package?.name || "—"} · {eventDate}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                        {s.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 border-t pt-4 mb-4">
                      <span>👥 {b.guestCount} guests</span>
                      <div className="col-span-2 bg-gray-50 rounded-xl p-4 mt-2">

  <div className="flex justify-between text-sm mb-2">
    <span className="text-gray-500">
      Total Amount
    </span>

    <span className="font-semibold text-gray-800">
      ₹{b.totalAmount?.toLocaleString("en-IN")}
    </span>
  </div>

  <div className="flex justify-between text-sm mb-2">
    <span className="text-gray-500">
      Paid Amount
    </span>

    <span className="font-semibold text-green-600">
      ₹{(b.advanceAmount || 0).toLocaleString("en-IN")}
    </span>
  </div>

  <div className="flex justify-between text-sm">
    <span className="text-gray-500">
      Remaining Amount
    </span>

    <span className="font-bold text-red-600">
     ₹{remainingAmount.toLocaleString("en-IN")}
    </span>
  </div>

</div>
                      <span>📅 Booked {new Date(b.createdAt).toLocaleDateString("en-IN")}</span>
                      <span>🆔 #{b._id?.slice(-8).toUpperCase()}</span>
                    </div>

                    {b.adminNote && (
                      <div className="mb-4 bg-gold/10 border border-gold/30 rounded-xl p-4 text-sm">
                        <p className="font-semibold text-gray-700 mb-1">Message from Kalawati Devi Utsav Lawn:</p>
                        <p className="text-gray-600">{b.adminNote}</p>
                      </div>
                    )}

                    {/* Payment Button */}
                    
 {/* Payment Button */}

{b.status === "confirmed" && remainingAmount > 0 && (
  <button
    onClick={() => setPaymentModal(b)}
    className="flex items-center gap-2 px-4 py-2 bg-gold text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-colors"
  >
    💳 Pay Now
  </button>
)}
{/* Payment History */}
{Array.isArray(b.paymentHistory) && b.paymentHistory.length > 0 && (
  <div className="mt-4 border-t pt-4">
    <h3 className="font-semibold text-gray-800 mb-3">
      Payment History
    </h3>

    <div className="space-y-3">
      {b.paymentHistory.map((payment, index) => {
        const statusConfig = {
          pending: {
            label: "Pending Review",
            className: "bg-yellow-100 text-yellow-800",
          },
          success: {
            label: "Approved",
            className: "bg-green-100 text-green-800",
          },
          failed: {
            label: "Rejected",
            className: "bg-red-100 text-red-800",
          },
        };

        const status =
          statusConfig[payment.status] || statusConfig.pending;

        return (
          <div
            key={payment._id || index}
            className="bg-gray-50 rounded-xl p-4 border"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-semibold text-gray-800">
                  ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Mode:{" "}
                  {payment.paymentMethod === "upi"
                    ? "QR / UPI"
                    : payment.paymentMethod === "razorpay"
                    ? "Razorpay"
                    : payment.paymentMethod || "—"}
                </p>

                {payment.transactionId && (
                  <p className="text-xs text-gray-500 mt-1">
                    UTR / Transaction ID: {payment.transactionId}
                  </p>
                )}

                {payment.paidAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Date:{" "}
                    {new Date(payment.paidAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            {payment.note && (
              <p className="text-xs text-gray-600 mt-2">
                Note: {payment.note}
              </p>
            )}

            {payment.receiptAttachment && (
              <a
                href={payment.receiptAttachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-blue-600 hover:underline"
              >
                📎 View Receipt
              </a>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap border-t pt-4">
                      <button
                        onClick={() => generateBillPDF(b)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        📄 Download Bill
                      </button>
                      <button
                        onClick={() => shareOnWhatsApp(b)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                      >
                        💬 WhatsApp
                      </button>
                      {b.contactEmail && (
                        <button
                          onClick={() => shareViaEmail(b)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          ✉️ Email Bill
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
               )}

        {/* Payment Method Modal */}
        {paymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">
                  Choose Payment Method
                </h2>

                <button
                  onClick={() => setPaymentModal(null)}
                  className="text-gray-500 hover:text-gray-800 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">
                    Remaining Amount
                  </span>

                 <span className="font-bold text-red-600">
  ₹{Math.max(
    (paymentModal.totalAmount || 0) -
    (paymentModal.advanceAmount || 0),
    0
  ).toLocaleString("en-IN")}
</span>
                </div>
              </div>

              {/* Razorpay */}
              <button
                onClick={() => {
                  window.location.href =
                    `/pay/${paymentModal._id}`;
                }}
                className="w-full border border-gold rounded-xl p-4 mb-3 text-left hover:bg-gold/10 transition"
              >
                <p className="font-semibold text-gray-800">
                  💳 Pay via Razorpay
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Secure online payment using UPI, Card or Net Banking
                </p>
              </button>

              {/* QR */}
              <button
                onClick={() => {
                  setQrPaymentModal(paymentModal);
                  setPaymentModal(null);
                }}
                className="w-full border border-gray-300 rounded-xl p-4 text-left hover:bg-gray-50 transition"
              >
                <p className="font-semibold text-gray-800">
                  📱 Pay via QR
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Scan our QR and submit payment details for verification
                </p>
              </button>

            </div>
          </div>
        )}

        {/* QR Payment Modal */}
        {qrPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">

              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">
                  Pay via QR
                </h2>

                <button
                  onClick={() => setQrPaymentModal(null)}
                  className="text-gray-500 hover:text-gray-800 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-500">
                  Booking ID
                </p>

                <p className="font-semibold">
                  #{qrPaymentModal._id?.slice(-8).toUpperCase()}
                </p>

                <p className="text-sm text-gray-500 mt-3">
                  Remaining Amount
                </p>

                <p className="text-lg font-bold text-red-600">
                  ₹{Math.max(
                    (qrPaymentModal.totalAmount || 0) -
                    (qrPaymentModal.advanceAmount || 0),
                    0
                  ).toLocaleString("en-IN")}
                </p>
              </div>

              {/* QR IMAGE */}
              <div className="flex justify-center mb-5">
                <img
                  src="/images/payment-qr.png"
                  alt="Payment QR"
                  className="w-56 h-56 object-contain border rounded-xl"
                />
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  const form = e.currentTarget;
                  const formData = new FormData(form);

                  try {
                    setQrSubmitting(true);

                    const res = await api.post(
                      `/bookings/${qrPaymentModal._id}/qr-payment`,
                      formData,
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                          "Content-Type": "multipart/form-data",
                        },
                      }
                    );

                    toast.success(
                      res.data.message ||
                      "Payment submitted successfully"
                    );

                    setQrPaymentModal(null);

                    // Refresh booking list
                    const bookingRes = await api.get("/bookings/track", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

setBookings(bookingRes.data.bookings || []);

                  } catch (err) {
                    toast.error(
                      err.response?.data?.message ||
                      "Failed to submit QR payment"
                    );
                  } finally {
                    setQrSubmitting(false);
                  }
                }}
                className="space-y-4"
              >

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    min="1"
                    max={Math.max(
                      (qrPaymentModal.totalAmount || 0) -
                      (qrPaymentModal.advanceAmount || 0),
                      0
                    )}
                    placeholder="Enter amount"
                    className="input-field w-full"
                    required
                  />
                </div>

                {/* UTR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction / UTR ID *
                  </label>

                  <input
                    type="text"
                    name="transactionId"
                    placeholder="Enter UTR / Transaction ID"
                    className="input-field w-full"
                    required
                  />
                </div>

                {/* Receipt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Screenshot / Receipt *
                  </label>

                  <input
                    type="file"
                    name="receipt"
                    accept="image/*,.pdf"
                    className="w-full text-sm"
                    required
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (Optional)
                  </label>

                  <textarea
                    name="note"
                    rows="3"
                    placeholder="Any additional information"
                    className="input-field w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={qrSubmitting}
                  className="w-full btn-gold rounded-xl py-3 font-semibold"
                >
                  {qrSubmitting
                    ? "Submitting..."
                    : "Submit Payment for Verification"}
                </button>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}