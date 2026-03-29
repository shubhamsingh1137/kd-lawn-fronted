import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success("Account created! Welcome to Kalawati.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-2">Register to book Kalawati Marriage Lawn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Full Name",        name: "name",            type: "text",     placeholder: "Your full name" },
            { label: "Email Address",    name: "email",           type: "email",    placeholder: "you@example.com" },
            { label: "Phone Number",     name: "phone",           type: "tel",      placeholder: "+91 XXXXX XXXXX" },
            { label: "Password",         name: "password",        type: "password", placeholder: "Min 6 characters" },
            { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Re-enter password" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type} name={name} value={form[name]}
                onChange={handleChange} required
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="btn-gold w-full text-base py-3 rounded-lg disabled:opacity-60 mt-2"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gold font-medium hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}
