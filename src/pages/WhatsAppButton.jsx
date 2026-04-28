import { useState } from "react";
import { FaWhatsapp, FaTimes } from "react-icons/fa";

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  const contacts = [
    { name: "KD Utsav Lawn", label: "For Reservation", phone: "918808085237" },
    { name: "KD Utsav Lawn", label: "For Feedback", phone: "918808085237" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-start gap-3">
      
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl w-72 overflow-hidden">
          <div className="bg-green-500 px-4 py-4 flex items-center gap-3">
            <FaWhatsapp size={36} className="text-white" />
            <div>
              <p className="text-white font-bold text-base">Reserve or Feedback</p>
              <p className="text-green-100 text-xs">Hi! Click one of our member below to chat on WhatsApp</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs px-4 py-2">The team typically replies in a few minutes.</p>
          <div className="flex flex-col">
            {contacts.map((c, i) => (
  <a
    key={i}
    href={`https://wa.me/${c.phone}?text=Hello, I want to enquire about booking`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors"
  >
    <div className="bg-green-500 rounded-full p-2">
      <FaWhatsapp size={20} className="text-white" />
    </div>
    <div className="flex-1">
      <p className="font-bold text-sm text-gray-800">{c.name}</p>
      <p className="text-xs text-gray-400 uppercase">{c.label}</p>
    </div>
    <FaWhatsapp size={20} className="text-green-500" />
  </a>
))}
          </div>
        </div>
      )}

      <button
  onClick={() => setOpen(!open)}
  className={`bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 ${
    !open ? "animate-bounce" : ""
  }`}
>
  {open ? <FaTimes size={22} /> : <FaWhatsapp size={28} />}
</button>

    </div>
  );
}