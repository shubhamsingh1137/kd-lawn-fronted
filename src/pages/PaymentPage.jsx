import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const ADVANCE_AMOUNT = 5000;

// Razorpay script loader
const loadRazorpay = () =>
  new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [payType,  setPayType]  = useState("advance");  // "advance" | "balance"
  const [paying,   setPaying]   = useState(false);
  const [paid,     setPaid]     = useState(false);

  // ── Booking details fetch karo ────────────────────────────────
  const { data, isLoading, isError } = useQuery(
    ["bookingPublic", bookingId],
    () => api.get(`/bookings/${bookingId}/public`).then(r => r.data.booking),
    { retry: false }
  );

  const booking = data;

  // ── Login check ───────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-xl font-serif font-bold text-gray-800 mb-2">
            first login through
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Payment karne ke liye apna mobile number se OTP login karein.
          </p>
          <a
            href={`/otp-login?redirect=/pay/${bookingId}`}
            className="btn-gold block py-3 rounded-xl text-center"
          >
            Mobile OTP se Login →
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gold rounded-full animate-spin"/>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-gray-600">Booking is not there,plzz check the link.</p>
        </div>
      </div>
    );
  }

  // Agar already fully paid hai
  if (booking.paymentStatus === "fully_paid") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
            Full Payment was done.
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your Booking Payment Is Fully Recived.
          </p>
          <button onClick={() => navigate("/dashboard")} className="btn-gold py-3 px-8 rounded-xl">
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  const balanceDue     = booking.totalAmount - booking.advanceAmount;
  const advancePaid    = booking.paymentStatus === "advance_paid";
  const payableAmount  = payType === "advance" ? ADVANCE_AMOUNT : balanceDue;

  // ── Payment karo ─────────────────────────────────────────────
  const handlePay = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment system load nahi hua. Internet check karein.");
        setPaying(false);
        return;
      }

      // Backend se Razorpay order banao
      const { data: orderData } = await api.post("/bookings/create-order", {
        bookingId: booking._id,
        type:      payType,
      });

      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      orderData.order.amount,
        currency:    orderData.order.currency,
        name:        "KD Utsav Lawn",
        description: `${payType === "advance" ? "Advance" : "Balance"} Payment — ${booking.eventType}`,
        order_id:    orderData.order.id,

        // Payment success handler
        handler: async (response) => {
          try {
            await api.post("/bookings/verify-payment", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId:           booking._id,
              type:                payType,
            });
            toast.success("🎉 Payment successful! Receipt send to your email id.");
            setPaid(true);
          } catch {
            toast.error("Payment verify nahi hua. Support se contact karein.");
          }
        },

        prefill: {
          name:    booking.contactName,
          contact: booking.contactPhone,
          email:   booking.contactEmail || "",
        },

        theme: { color: "#c9a96e" },

        modal: {
          ondismiss: () => {
            toast("Payment cancel ki gayi.", { icon: "ℹ️" });
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (res) => {
        toast.error(`Payment failed: ${res.error.description}`);
        setPaying(false);
      });
      rzp.open();
      setPaying(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Kuch gadbad hui");
      setPaying(false);
    }
  };

  // ── Payment success screen ────────────────────────────────────
  if (paid) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            Rs {payableAmount.toLocaleString("en-IN")} ka payment receive ho gaya.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Receipt {booking.contactEmail} pe bheji gayi hai.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/dashboard")} className="btn-gold py-3 px-6 rounded-xl">
              My Bookings
            </button>
            <button
              onClick={() => navigate(`/track-booking`)}
              className="py-3 px-6 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Track Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main payment page ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-lg mx-auto px-4">

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gray-900 px-6 py-5">
            <h1 className="text-white font-serif text-xl font-bold">KD Utsav Lawn</h1>
            <p className="text-gray-400 text-sm mt-0.5">Booking Payment</p>
          </div>

          {/* Booking summary */}
          <div className="px-6 py-5 border-b">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
              Booking Details
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Naam",      value: booking.contactName },
                { label: "Event",     value: booking.eventType },
                { label: "Date",      value: new Date(booking.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
                { label: "Package",   value: booking.package?.name || "—" },
                { label: "Guests",    value: `${booking.guestCount} log` },
                { label: "Booking ID",value: `#${booking._id.slice(-8).toUpperCase()}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-medium text-gray-800 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="px-6 py-5 border-b bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total Amount</span>
                <span className="font-semibold text-gray-800">
                  Rs {booking.totalAmount?.toLocaleString("en-IN")}
                </span>
              </div>
              {advancePaid && (
                <div className="flex justify-between text-green-600">
                  <span>Advance Paid ✓</span>
                  <span>Rs {booking.advanceAmount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-amber-700 font-bold border-t pt-2 mt-2">
                <span>Balance Due</span>
                <span>Rs {balanceDue.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Payment type selector — sirf advance nahi diya tab dikhao */}
          {!advancePaid && (
            <div className="px-6 py-5 border-b">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
                Payment Select Karein
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${payType === "advance" ? "border-gold bg-gold/5" : "border-gray-200"}`}>
                  <input type="radio" name="payType" value="advance" checked={payType === "advance"}
                    onChange={() => setPayType("advance")} className="hidden"/>
                  <p className="font-semibold text-gray-800 text-sm">Advance</p>
                  <p className="text-gold font-bold text-lg mt-1">Rs 5,000</p>
                  <p className="text-xs text-gray-400 mt-1">pay in advance</p>
                </label>
                <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${payType === "balance" ? "border-gold bg-gold/5" : "border-gray-200"}`}>
                  <input type="radio" name="payType" value="balance" checked={payType === "balance"}
                    onChange={() => setPayType("balance")} className="hidden"/>
                  <p className="font-semibold text-gray-800 text-sm">Full Balance</p>
                  <p className="text-gold font-bold text-lg mt-1">Rs {balanceDue.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-gray-400 mt-1">Poora baaki pay karein</p>
                </label>
              </div>
            </div>
          )}

          {/* Balance payment option (advance already paid) */}
          {advancePaid && (
            <div className="px-6 py-4 border-b">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                ✅ Rs 5,000 advance already paid hai. Ab balance amount pay karein.
              </div>
            </div>
          )}

          {/* Pay button */}
          <div className="px-6 py-5">
            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-gold w-full py-4 text-base rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Processing...
                </>
              ) : (
                `Pay Rs ${payableAmount.toLocaleString("en-IN")} →`
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-3">
              <img src="https://razorpay.com/favicon.ico" alt="" className="w-4 h-4"/>
              <p className="text-xs text-gray-400">
                Razorpay se secure payment — UPI, Card, NetBanking
              </p>
            </div>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Help chahiye?{" "}
          <a href="tel:+918808085237" className="text-gold">+91 8808085237</a>
        </p>

      </div>
    </div>
  );
}