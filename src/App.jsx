import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./utils/ProtectedRoute";

// Layout
import Navbar  from "./components/layout/Navbar";
import Footer  from "./components/layout/Footer";

// Public pages
import Home     from "./pages/Home";
import Gallery  from "./pages/Gallery";
import Booking  from "./pages/Booking";
import About    from "./pages/About";
import Contact  from "./pages/Contact";
import Login    from "./pages/Login";
import Register from "./pages/Register";

// User
import UserDashboard from "./pages/UserDashboard";

// Admin
import AdminLayout       from "./pages/admin/AdminLayout";
import AdminHome         from "./pages/admin/AdminHome";
import ManageBookings    from "./pages/admin/ManageBookings";
import ManageGallery     from "./pages/admin/ManageGallery";
import ManageContent     from "./pages/admin/ManageContent";
import ManagePackages    from "./pages/admin/ManagePackages";
import ManageUsers       from "./pages/admin/ManageUsers";
import ManageTestimonials from "./pages/admin/ManageTestimonials";
import WhatsAppButton from "./pages/WhatsAppButton";

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/gallery"  element={<PublicLayout><Gallery /></PublicLayout>} />
        <Route path="/booking"  element={<PublicLayout><Booking /></PublicLayout>} />
        <Route path="/about"    element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/contact"  element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<PublicLayout><UserDashboard /></PublicLayout>} />
        </Route>

        {/* Admin protected */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index                  element={<AdminHome />} />
            <Route path="bookings"        element={<ManageBookings />} />
            <Route path="gallery"         element={<ManageGallery />} />
            <Route path="content"         element={<ManageContent />} />
            <Route path="packages"        element={<ManagePackages />} />
            <Route path="users"           element={<ManageUsers />} />
            <Route path="testimonials"    element={<ManageTestimonials />} />
          </Route>
        </Route>
      </Routes>
      <WhatsAppButton />
    </AuthProvider>
    
  );
}
