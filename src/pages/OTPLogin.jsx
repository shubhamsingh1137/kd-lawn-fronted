
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function OTPLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();

  const redirectTo = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timer <= 0) return;

    timerRef.current = setTimeout(() => {
      setTimer((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/send-otp", {
        email: cleanEmail,
      });

      setEmail(cleanEmail);
      setOtp("");
      setStep("otp");
      setTimer(60);

      toast.success(data.message || "OTP sent to your email");
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

    if (loading) return;

    if (!/^\d{6}$/.test(otp)) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp,
      });

      if (!data.token || !data.user) {
        throw new Error("Authentication token or user was not returned");
      }

      loginWithToken(data.token, data.user);

      toast.success(`Welcome, ${data.user.name || "Customer"}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>

          <h1 className="text-2xl font-serif font-bold text-gray-800">
            {step === "email" ? "Login Through Email" : "Verify Email OTP"}
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            {step === "email"
              ? "Enter the email address used while booking."
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input-field w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send Email OTP →"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-Digit OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                maxLength={6}
                required
                className="input-field w-full text-center text-2xl tracking-[0.5em] font-bold"
              />

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  OTP validity is 10 minutes.
                </p>

                {timer > 0 ? (
                  <p className="text-xs text-gray-400">
                    Resend in {timer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSendOTP}
                    className="text-xs text-gold underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-gold w-full py-3.5 rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify Email OTP ✓"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setTimer(0);
              }}
              className="w-full text-sm text-gray-400 hover:text-gray-600"
            >
              ← Change Email Address
            </button>
          </form>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">Admin access</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="text-center space-y-2">
          <Link
            to="/login"
            className="block text-sm text-gray-500 hover:text-gold transition-colors"
          >
            Admin? Login Through Password →
          </Link>

          <Link
            to="/"
            className="block text-xs text-gray-400 hover:text-gray-600"
          >
            ← Go Back To Home
          </Link>
        </div>
      </div>
    </div>
  );
}
