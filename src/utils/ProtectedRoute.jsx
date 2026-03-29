import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Requires login
export const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

// Requires admin role
export const AdminRoute = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login"   replace />;
  if (!isAdmin)    return <Navigate to="/"        replace />;
  return <Outlet />;
};
