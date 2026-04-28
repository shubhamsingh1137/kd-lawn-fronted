import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt, FaEnvelope, FaPhone, FaWhatsapp, FaInstagram, FaFacebookF } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa6";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/",        label: "Home"    },
  { to: "/gallery", label: "Gallery" },
  { to: "/booking", label: "Book Now"},
  { to: "/about",   label: "About"   },
  { to: "/contact", label: "Contact" },
];

const BookNowButton = ({ onClick }) => (
  <Link
    to="/booking"
    onClick={onClick}
    className="relative text-[15px] text-white font-bold px-8 py-2.5 rounded-md bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-700 hover:to-yellow-700 transition-all duration-200 shadow-lg border-2 border-yellow-400 animate-pulse overflow-hidden"
    style={{ boxShadow: "0 0 10px rgba(202,138,4,0.5), 0 0 20px rgba(202,138,4,0.3)" }}
  >
    <span className="relative z-10 tracking-widest uppercase">✦ Book Now ✦</span>
  </Link>
);

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpen(false);
  };

  return (
    <>
      {/* ── Top Info Ribbon ── */}
<div className="bg-yellow-900 text-yellow-100 py-2 px-4">
  <div className="max-w-7xl mx-auto flex items-center justify-between md:justify-center gap-3 md:gap-4 text-xs md:text-sm font-medium">
    
    <div className="flex items-center gap-3 md:gap-4">
      <a href="mailto:shubhamsingh1137@gmail.com" className="flex items-center gap-1 md:gap-2 hover:text-white transition-colors">
        <FaEnvelope size={12} />
        <span className="hidden sm:inline">shubhamsingh1137@gmail.com</span>
        <span className="sm:hidden">Email Us</span>
      </a>
      <span className="opacity-40">|</span>
      <a href="tel:+916393544576" className="flex items-center gap-1 md:gap-2 hover:text-white transition-colors">
        <FaPhone size={12} /> +91 6393544576
      </a>
      <span className="opacity-40 hidden md:inline">|</span>
      <div className="hidden md:flex items-center gap-4">
        <a href="#" className="hover:text-white transition-colors"><FaWhatsapp size={18} /></a>
        <a href="#" className="hover:text-white transition-colors"><FaInstagram size={18} /></a>
        <a href="#" className="hover:text-white transition-colors"><FaFacebookF size={18} /></a>
        <a href="#" className="hover:text-white transition-colors"><FaYoutube size={18} /></a>
      </div>
    </div>

    {/* Mobile hamburger — only in ribbon */}
    <button
      className="md:hidden p-1 rounded text-yellow-100 hover:text-white transition-colors"
      onClick={() => setOpen(!open)}
      aria-label="Toggle menu"
    >
      {open ? <FaTimes size={20} /> : <FaBars size={20} />}
    </button>

  </div>
</div>

      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-lg" : "bg-white/95 backdrop-blur-sm shadow-md"
        }`}
      >
        {/* Top decorative gold bar */}
        <div className="h-1 w-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <img
                src="/icon.jpeg"
                alt="KD Utsav Lawn"
                className="h-12 w-12 rounded-full object-cover border-2 border-yellow-600 shadow-sm"
              />
              <div className="leading-tight">
                <p className="text-yellow-700 text-2xl font-serif font-extrabold tracking-widest leading-none uppercase">
                  KD Utsav Lawn
                </p>
                <p className="text-gray-500 text-[11px] tracking-[2px] uppercase mt-1.5 font-semibold text-center">
                  Kalawati Devi Marriage Lawn
                </p>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `relative text-[15px] font-medium px-5 py-2.5 rounded-md transition-all duration-200 group
                    ${isActive
                      ? "text-yellow-700 bg-yellow-50"
                      : "text-gray-600 hover:text-yellow-700 hover:bg-yellow-50"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      <span
                        className={`absolute bottom-1 left-5 right-5 h-0.5 bg-yellow-500 rounded-full transition-all duration-300 ${
                          isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* ── Auth Buttons (Desktop) ── */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn && isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-[15px] text-yellow-700 font-semibold px-5 py-2.5 rounded-md border border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-[15px] text-red-500 font-medium px-4 py-2.5 rounded-md hover:bg-red-50 transition-colors duration-200"
                  >
                    <FaSignOutAlt size={13} />
                    Logout
                  </button>
                </>
              ) : (
                <BookNowButton />
              )}
            </div>
          
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            open ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white border-t border-gray-100 px-6 py-5 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-[15px] font-medium px-4 py-3 rounded-md transition-colors duration-200 ${
                    isActive
                      ? "text-yellow-700 bg-yellow-50"
                      : "text-gray-700 hover:text-yellow-700 hover:bg-yellow-50"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
              {isLoggedIn && isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="text-[15px] text-yellow-700 font-semibold px-4 py-3 rounded-md bg-yellow-50 text-center"
                  >
                    Admin Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 text-[15px] text-red-500 font-medium px-4 py-3 rounded-md hover:bg-red-50 transition-colors duration-200"
                  >
                    <FaSignOutAlt size={14} />
                    Logout
                  </button>
                </>
              ) : (
                <BookNowButton onClick={() => setOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}