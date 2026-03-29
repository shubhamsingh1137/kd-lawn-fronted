import { Link } from "react-router-dom";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="md:col-span-1">
          <h2 className="text-gold text-2xl font-serif font-bold mb-2">Kalawati</h2>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Marriage Lawn</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Creating beautiful memories for your most special day. A venue where traditions meet elegance.
          </p>
          <div className="flex gap-4 mt-5">
            <a href="#" className="text-gray-400 hover:text-gold transition-colors"><FaFacebook size={20}/></a>
            <a href="#" className="text-gray-400 hover:text-gold transition-colors"><FaInstagram size={20}/></a>
            <a href="#" className="text-gray-400 hover:text-gold transition-colors"><FaWhatsapp size={20}/></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Quick Links</h3>
          <ul className="space-y-2">
            {["/", "/gallery", "/booking", "/about", "/contact"].map((path, i) => (
              <li key={path}>
                <Link to={path} className="text-sm text-gray-400 hover:text-gold transition-colors">
                  {["Home", "Gallery", "Book Now", "About Us", "Contact"][i]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Services</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {["Wedding Ceremony", "Reception Hall", "Engagement Party", "Birthday Events", "Corporate Events", "Catering Services"].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Contact Us</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-gold mt-0.5 shrink-0"/>
              <span>123, Marriage Lawn Road, Kanpur, Uttar Pradesh - 208001</span>
            </li>
            <li className="flex items-center gap-3">
              <FaPhone className="text-gold shrink-0"/>
              <a href="tel:+919999999999" className="hover:text-gold">+91 99999 99999</a>
            </li>
            <li className="flex items-center gap-3">
              <FaEnvelope className="text-gold shrink-0"/>
              <a href="mailto:info@kalawati.com" className="hover:text-gold">info@kalawati.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Kalawati Marriage Lawn. All rights reserved.
      </div>
    </footer>
  );
}
