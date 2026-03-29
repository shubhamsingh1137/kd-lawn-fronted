import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaTachometerAlt, FaCalendarCheck, FaImages,
  FaLayerGroup, FaBoxOpen, FaUsers, FaQuoteLeft, FaSignOutAlt,
} from "react-icons/fa";

const navItems = [
  { to: "/admin",              label: "Dashboard",    icon: <FaTachometerAlt/>, end: true },
  { to: "/admin/bookings",     label: "Bookings",     icon: <FaCalendarCheck/>  },
  { to: "/admin/gallery",      label: "Gallery",      icon: <FaImages/>         },
  { to: "/admin/content",      label: "Site Content", icon: <FaLayerGroup/>     },
  { to: "/admin/packages",     label: "Packages",     icon: <FaBoxOpen/>        },
  { to: "/admin/testimonials", label: "Testimonials", icon: <FaQuoteLeft/>      },
  { to: "/admin/users",        label: "Users",        icon: <FaUsers/>          },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-gray-700">
          <h1 className="text-gold font-serif text-xl font-bold">Kalawati</h1>
          <p className="text-gray-400 text-xs mt-1 tracking-widest uppercase">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive ? "bg-gold text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`
              }
            >
              <span className="text-base">{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FaSignOutAlt/> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
