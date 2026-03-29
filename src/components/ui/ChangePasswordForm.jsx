// src/components/ui/ChangePasswordForm.jsx
import { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ChangePasswordForm({ onClose }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword)
      return toast.error("Passwords do not match");
    if (form.newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      await api.put("/users/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed successfully!");
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: "Current Password", name: "currentPassword" },
        { label: "New Password",     name: "newPassword" },
        { label: "Confirm Password", name: "confirmPassword" },
      ].map(({ label, name }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type="password"
            value={form[name]}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            required
            placeholder="••••••••"
            className="input-field"
          />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-gold flex-1 py-2.5 disabled:opacity-60">
          {loading ? "Saving..." : "Change Password"}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
