import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-2">Login to your Kalawati account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} required
              placeholder="you@example.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} required
              placeholder="••••••••"
              className="input-field"
            />
          </div>
          <button type="submit" disabled={loading}
            className="btn-gold w-full text-base py-3 rounded-lg disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-gold font-medium hover:underline">Register here</Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
