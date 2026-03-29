import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/",        label: "Home"    },
  { to: "/gallery", label: "Gallery" },
  { to: "/booking", label: "Book Now"},
  { to: "/about",   label: "About"   },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-gold text-2xl font-serif font-bold">Kalawati</span>
          <span className="text-gray-600 text-xs font-medium hidden sm:block tracking-widest uppercase">Marriage Lawn</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to} to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-gold" : "text-gray-600 hover:text-gold"}`
              }
            >{l.label}</NavLink>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {isAdmin
                ? <Link to="/admin" className="text-sm text-gold font-medium hover:underline">Dashboard</Link>
                : <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gold"><FaUser size={13}/> {user.name}</Link>
              }
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
                <FaSignOutAlt size={13}/> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm text-gray-600 hover:text-gold font-medium">Login</Link>
              <Link to="/register" className="btn-gold text-sm py-2 px-4 rounded">Register</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-gray-600" onClick={() => setOpen(!open)}>
          {open ? <FaTimes size={20}/> : <FaBars size={20}/>}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-gold"
            >{l.label}</NavLink>
          ))}
          <hr />
          {isLoggedIn ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="text-sm text-gold font-medium">
                {isAdmin ? "Admin Dashboard" : "My Dashboard"}
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-500 text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setOpen(false)} className="text-sm text-gray-700">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-gold text-sm py-2 px-4 rounded text-center">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
