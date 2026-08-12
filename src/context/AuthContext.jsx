import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("User parse error:", error);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // Normal Login
  // =========================
  const login = async (email, password) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);

      return data;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OTP Login
  // =========================
 const loginWithToken = (token, userData) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));
  setUser(userData);
};

  // =========================
  // Register
  // =========================
  const register = async (formData) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", formData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);

      return data;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Logout
  // =========================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isLoggedIn,
        login,
        loginWithToken,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);