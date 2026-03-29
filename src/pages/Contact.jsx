import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from "react-icons/fa";

export default function Contact() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-gray-900 text-white py-20 text-center">
        <p className="section-subtitle text-gold">Get In Touch</p>
        <h1 className="section-title text-white">Contact Us</h1>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6">Visit Us</h2>
          <div className="space-y-5">
            {[
              { icon: <FaMapMarkerAlt className="text-gold"/>, label: "Address", value: "123 Marriage Lawn Road, Kanpur, UP - 208001" },
              { icon: <FaPhone className="text-gold"/>,        label: "Phone",   value: "+91 99999 99999" },
              { icon: <FaEnvelope className="text-gold"/>,     label: "Email",   value: "info@kalawati.com" },
              { icon: <FaClock className="text-gold"/>,        label: "Hours",   value: "Mon–Sun: 9:00 AM – 9:00 PM" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="mt-1 text-lg">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{label}</p>
                  <p className="text-gray-600 text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Quick enquiry form */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-serif font-bold text-gray-800 mb-6">Send an Enquiry</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Your Name" className="input-field"/>
            <input type="email" placeholder="Email Address" className="input-field"/>
            <input type="tel" placeholder="Phone Number" className="input-field"/>
            <textarea rows={4} placeholder="Your message..." className="input-field resize-none"/>
            <button className="btn-gold w-full py-3 rounded-xl">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );
}
