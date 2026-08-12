import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function OTPLogin() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const { loginWithToken } = useAuth(); // AuthContext mein add karna padega (neeche dekho)

  const redirectTo = params.get("redirect") || "/dashboard";

  const [step,    setStep]    = useState("phone"); // "phone" | "otp"
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [timer,   setTimer]   = useState(0);

  // ── Step 1: OTP bhejo ──────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone))
      return toast.error("Enter 10-digit valid mobile number");

    setLoading(true);
    try {
      const res = await api.post("/auth/send-otp", { phone });
      toast.success("OTP send!");
      setStep("otp");
      // 60 second countdown
      setTimer(60);
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
      // Dev mein console pe OTP aata hai
      if (res.data.otp) {
        console.log("Dev OTP:", res.data.otp);
        toast(`Dev OTP: ${res.data.otp}`, { icon: "🔐", duration: 10000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP not send");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP verify karo ───────────────────────────────────
 const handleVerifyOTP = async (e) => {
  e.preventDefault();

  if (loading) return;

  if (otp.length !== 6) {
    return toast.error("Enter 6-Digit OTP");
  }

  setLoading(true);

  try {
    const { data } = await api.post("/auth/verify-otp", {
      phone,
      otp,
    });

    // ✅ Save token + user + update AuthContext
    loginWithToken(data.token, data.user);

    toast.success(
      `Welcome, ${data.user.name || "Guest"}!`
    );

    // ✅ Go back to original requested page
    navigate(redirectTo, { replace: true });

  } catch (err) {
    console.error("OTP verification error:", err);

    toast.error(
      err.response?.data?.message ||
      "OTP was wrong"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">
            {step === "phone" ? "Login Through Mobile" : "Enter Valid OTP"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === "phone"
              ? "Don't Need Password Enter Only Mobile Number"
              : `OTP Send To This Mobile Number ${phone}`}
          </p>
        </div>

        {/* Step 1 — Phone */}
        {step === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  required
                  className="input-field rounded-l-none flex-1 border-l-0"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Enter The Same Number Which Is Given During Booking
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="btn-gold w-full py-3.5 rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  OTP bheja ja raha hai...
                </span>
              ) : "OTP Bhejein →"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-Digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                required
                className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">OTP Is Valid For Only 10 Min</p>
                {timer > 0 ? (
                  <p className="text-xs text-gray-400">{timer}s resend</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(""); }}
                    className="text-xs text-gold underline"
                  >
                    Send Again
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-gold w-full py-3.5 rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Verify ho raha hai...
                </span>
              ) : "Please Login ✓"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600"
            >
              ← Change Phone Number
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100"/>
          <span className="text-xs text-gray-400">ya</span>
          <div className="flex-1 h-px bg-gray-100"/>
        </div>

        {/* Admin login link */}
        <div className="text-center space-y-2">
          <Link to="/login" className="block text-sm text-gray-500 hover:text-gold transition-colors">
            Admin? Login Through Password →
          </Link>
          <Link to="/" className="block text-xs text-gray-400 hover:text-gray-600">
            ← Go Back To Home 
          </Link>
        </div>

      </div>
    </div>
  );
}