import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// Razorpay script loader
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const { isLoggedIn } = useAuth();

  // User jitna amount enter karega
  const [paymentAmount, setPaymentAmount] = useState("");

  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  // ---------------------------------------------------------
  // Booking details
  // ---------------------------------------------------------
  const { data, isLoading, isError } = useQuery(
    ["bookingPublic", bookingId],
    () =>
      api
        .get(`/bookings/${bookingId}/public`)
        .then((r) => r.data.booking),
    {
      retry: false,
    }
  );

  const booking = data;

  // ---------------------------------------------------------
  // Login check
  // ---------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">

          <div className="text-5xl mb-4">
            🔐
          </div>

          <h2 className="text-xl font-serif font-bold text-gray-800 mb-2">
            Login Required
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            Payment karne ke liye apne mobile number se OTP login karein.
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

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">

        <div className="w-8 h-8 border-2 border-gray-200 border-t-gold rounded-full animate-spin" />

      </div>
    );
  }

  // ---------------------------------------------------------
  // Booking error
  // ---------------------------------------------------------
  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">

        <div className="text-center">

          <div className="text-5xl mb-4">
            ❌
          </div>

          <p className="text-gray-600">
            Booking is not there, please check the link.
          </p>

        </div>

      </div>
    );
  }

  // ---------------------------------------------------------
  // Amount calculations
  // ---------------------------------------------------------

  const totalAmount = Number(
    booking.totalAmount || 0
  );

  /*
    advanceAmount ko hum total already paid
    amount ke roop mein use kar rahe hain.

    Backend mein multiple payments hone par
    advanceAmount update hona chahiye.
  */
  const alreadyPaid = Number(
    booking.advanceAmount || 0
  );

  const balanceDue = Math.max(
    totalAmount - alreadyPaid,
    0
  );

  const payableAmount = Number(
    paymentAmount || 0
  );

  // ---------------------------------------------------------
  // Fully paid
  // ---------------------------------------------------------
  if (
    booking.paymentStatus === "fully_paid" ||
    balanceDue <= 0
  ) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">

        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">

          <div className="text-6xl mb-4">
            ✅
          </div>

          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
            Full Payment Done
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            Your booking payment is fully received.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">

            <p className="text-xs text-green-600 uppercase">
              Total Paid
            </p>

            <p className="text-2xl font-bold text-green-700 mt-1">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>

          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="btn-gold py-3 px-8 rounded-xl"
          >
            View Dashboard
          </button>

        </div>

      </div>
    );
  }

  // ---------------------------------------------------------
  // Payment
  // ---------------------------------------------------------
  const handlePay = async () => {

    // Prevent multiple clicks
    if (paying) return;

    const amount = Number(paymentAmount);

    // Amount validation
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    if (amount > balanceDue) {
      toast.error(
        `Maximum payment ₹${balanceDue.toLocaleString(
          "en-IN"
        )} hai.`
      );
      return;
    }

    setPaying(true);

    try {

      // -----------------------------------------------------
      // Load Razorpay
      // -----------------------------------------------------
      const loaded = await loadRazorpay();

      if (!loaded) {

        toast.error(
          "The payment system could not be loaded. Please check your internet connection."
        );

        setPaying(false);
        return;
      }

      // -----------------------------------------------------
      // Create Razorpay order
      // -----------------------------------------------------
      const { data: orderData } = await api.post(
        "/bookings/create-order",
        {
          bookingId: booking._id,
          amount: amount,
        }
      );

      // -----------------------------------------------------
      // Razorpay options
      // -----------------------------------------------------
      const options = {

        key: import.meta.env.VITE_RAZORPAY_KEY_ID,

        amount: orderData.order.amount,

        currency: orderData.order.currency,

        name: "KD Utsav Lawn",

        description: `Booking Payment — ${booking.eventType}`,

        order_id: orderData.order.id,

        // ---------------------------------------------------
        // Payment successful
        // ---------------------------------------------------
        handler: async (response) => {

          try {

            await api.post(
              "/bookings/verify-payment",
              {
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,

                bookingId: booking._id,
              }
            );

            toast.success(
              "🎉 Payment successful! The receipt has been sent to your email."
            );

            setPaid(true);

          } catch (error) {

            console.error(
              "Payment verification error:",
              error
            );

            toast.error(
              error.response?.data?.message ||
                "Payment could not be verified. Please contact support."
            );

          } finally {

            setPaying(false);

          }
        },

        // ---------------------------------------------------
        // Customer information
        // ---------------------------------------------------
        prefill: {
          name: booking.contactName,

          contact: booking.contactPhone,

          email: booking.contactEmail || "",
        },

        // ---------------------------------------------------
        // Razorpay theme
        // ---------------------------------------------------
        theme: {
          color: "#c9a96e",
        },

        // ---------------------------------------------------
        // Razorpay close
        // ---------------------------------------------------
        modal: {

          ondismiss: () => {

            toast(
              "Payment cancel ki gayi.",
              {
                icon: "ℹ️",
              }
            );

            setPaying(false);
          },

        },

      };

      // -----------------------------------------------------
      // Open Razorpay
      // -----------------------------------------------------
      const rzp = new window.Razorpay(options);

      // Payment failed
      rzp.on(
        "payment.failed",
        (res) => {

          toast.error(
            `Payment failed: ${res.error.description}`
          );

          setPaying(false);
        }
      );

      rzp.open();

    } catch (err) {

      console.error(
        "Create payment order error:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          "Payment order create nahi ho saka."
      );

      setPaying(false);
    }
  };

  // ---------------------------------------------------------
  // Payment success screen
  // ---------------------------------------------------------
  if (paid) {

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">

        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">

          <div className="text-6xl mb-4">
            🎉
          </div>

          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
            Payment Successful!
          </h2>

          <p className="text-gray-500 text-sm mb-2">
            ₹{payableAmount.toLocaleString("en-IN")} ka payment
            receive ho gaya.
          </p>

          <p className="text-gray-400 text-xs mb-6">
            Receipt {booking.contactEmail || "your email"} pe
            bheji gayi hai.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">

            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">
                Payment
              </span>

              <span className="font-semibold text-green-600">
                ₹{payableAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Previous Paid
              </span>

              <span className="font-medium">
                ₹{alreadyPaid.toLocaleString("en-IN")}
              </span>
            </div>

          </div>

          <div className="flex gap-3 justify-center">

            <button
              onClick={() => navigate("/dashboard")}
              className="btn-gold py-3 px-6 rounded-xl"
            >
              My Bookings
            </button>

            <button
              onClick={() => navigate("/track-booking")}
              className="py-3 px-6 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Track Booking
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ---------------------------------------------------------
  // Main payment page
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-cream py-12">

      <div className="max-w-lg mx-auto px-4">

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gray-900 px-6 py-5">

            <h1 className="text-white font-serif text-xl font-bold">
              KD Utsav Lawn
            </h1>

            <p className="text-gray-400 text-sm mt-0.5">
              Booking Payment
            </p>

          </div>


          {/* Booking summary */}
          <div className="px-6 py-5 border-b">

            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
              Booking Details
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">

              {[
                {
                  label: "Naam",
                  value: booking.contactName,
                },

                {
                  label: "Event",
                  value: booking.eventType,
                },

                {
                  label: "Date",
                  value: new Date(
                    booking.eventDate
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  ),
                },

                {
                  label: "Package",
                  value:
                    booking.package?.name || "—",
                },

                {
                  label: "Guests",
                  value: `${booking.guestCount} log`,
                },

                {
                  label: "Booking ID",
                  value: `#${booking._id
                    .slice(-8)
                    .toUpperCase()}`,
                },

              ].map(
                ({ label, value }) => (

                  <div key={label}>

                    <p className="text-gray-400 text-xs">
                      {label}
                    </p>

                    <p className="font-medium text-gray-800 text-sm">
                      {value}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>


          {/* Amount breakdown */}
          <div className="px-6 py-5 border-b bg-gray-50">

            <div className="space-y-3 text-sm">

              {/* Total */}
              <div className="flex justify-between text-gray-600">

                <span>
                  Total Amount
                </span>

                <span className="font-semibold text-gray-800">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>

              </div>


              {/* Paid */}
              <div className="flex justify-between text-green-600">

                <span>
                  Total Paid ✓
                </span>

                <span className="font-semibold">
                  ₹{alreadyPaid.toLocaleString("en-IN")}
                </span>

              </div>


              {/* Remaining */}
              <div className="flex justify-between text-amber-700 font-bold border-t pt-3">

                <span>
                  Remaining Amount
                </span>

                <span>
                  ₹{balanceDue.toLocaleString("en-IN")}
                </span>

              </div>

            </div>

          </div>


          {/* Custom payment amount */}
          <div className="px-6 py-5 border-b">

            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
              Payment Amount
            </p>


            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kitna payment karna hai?
            </label>


            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ₹
              </span>

              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => {

                  const value =
                    e.target.value;

                  // Empty input allow karo
                  if (value === "") {
                    setPaymentAmount("");
                    return;
                  }

                  const numericValue =
                    Number(value);

                  // Maximum balance se zyada nahi
                  if (
                    numericValue <=
                    balanceDue
                  ) {
                    setPaymentAmount(value);
                  }

                }}
                placeholder="Enter amount"
                min="1"
                max={balanceDue}
                className="input-field pl-8 text-lg font-semibold"
              />


            </div>


            <p className="text-xs text-gray-400 mt-2">
              Minimum ₹1 aur maximum ₹
              {balanceDue.toLocaleString("en-IN")} pay
              kar sakte hain.
            </p>


            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">

              {[5000, 10000, 25000].map(
                (amount) => {

                  if (amount > balanceDue) {
                    return null;
                  }

                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          String(amount)
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gold hover:text-gold"
                    >
                      ₹
                      {amount.toLocaleString(
                        "en-IN"
                      )}
                    </button>
                  );

                }
              )}


              {/* Full payment */}
              <button
                type="button"
                onClick={() =>
                  setPaymentAmount(
                    String(balanceDue)
                  )
                }
                className="px-3 py-2 rounded-lg border border-gold text-gold text-sm font-medium hover:bg-gold/5"
              >
                Pay Full ₹
                {balanceDue.toLocaleString(
                  "en-IN"
                )}
              </button>

            </div>

          </div>


          {/* Payment information */}
          <div className="px-6 py-4 border-b">

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">

              💳 You can pay any amount at your convenience.

              <br />

              Remaining amount:
              <strong className="ml-1">
                ₹{balanceDue.toLocaleString("en-IN")}
              </strong>

            </div>

          </div>


          {/* Pay button */}
          <div className="px-6 py-5">

            <button
              onClick={handlePay}
              disabled={
                paying ||
                !paymentAmount ||
                Number(paymentAmount) <= 0 ||
                Number(paymentAmount) >
                  balanceDue
              }
              className="btn-gold w-full py-4 text-base rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >

              {paying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />

                  Processing...
                </>
              ) : (
                `Pay ₹${payableAmount.toLocaleString(
                  "en-IN"
                )} →`
              )}

            </button>


            {/* Razorpay */}
            <div className="flex items-center justify-center gap-2 mt-3">

              <img
                src="https://razorpay.com/favicon.ico"
                alt=""
                className="w-4 h-4"
              />

              <p className="text-xs text-gray-400">
                Razorpay se secure payment — UPI,
                Card, NetBanking
              </p>

            </div>

          </div>

        </div>


        {/* Help */}
        <p className="text-center text-xs text-gray-400 mt-4">

          Help?{" "}

          <a
            href="tel:+918808085237"
            className="text-gold"
          >
            +91 8808085237
          </a>

        </p>

      </div>

    </div>
  );
}