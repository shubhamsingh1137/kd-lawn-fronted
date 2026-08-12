import { useState } from "react";
import emailjs from "@emailjs/browser";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

// ✅ EmailJS keys
const EMAILJS_SERVICE_ID  = "service_u06oh5q";
const EMAILJS_TEMPLATE_ID = "template_o7d70ym";
const EMAILJS_PUBLIC_KEY  = "r3yw0W26c2k4WHhN1";

// ✅ Admin details
const ADMIN_WHATSAPP = "918808085237";
const ADMIN_PHONE    = "918808085237";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [step, setStep] = useState("form"); // "form" | "confirm" | "sending" | "sent" | "error"
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is compulsory";
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = "enter 10 digit valid number ";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "enter valid email id ";
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStep("confirm");
  };

  // 1️⃣ EmailJS — background mein send
  const sendEmail = async () => {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        from_name:  form.name,
        from_email: form.email || "N/A",
        phone:      form.phone,
        message:    form.message || "N/A",
      },
      EMAILJS_PUBLIC_KEY
    );
  };

  // 2️⃣ WhatsApp
  const sendToWhatsApp = () => {
    const text =
      `🌸 *New Enquiry – Kalawati Devi Utsav Lawn*\n\n` +
      `👤 *Name:* ${form.name}\n` +
      `📱 *Phone:* ${form.phone}\n` +
      `📧 *Email:* ${form.email || "N/A"}\n` +
      `💬 *Message:* ${form.message || "N/A"}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // 3️⃣ SMS
const sendSMS = async () => {
  try {
    await fetch("http://localhost:5000/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:    form.name,
        phone:   form.phone,
        email:   form.email  || "N/A",
        message: form.message || "N/A",
      }),
    });
  } catch (err) {
    console.error("SMS error:", err);
  }
};

  // 🚀 Teeno ek saath
  const sendAll = async () => {
    setStep("sending");
    try {
      await sendEmail();
      sendToWhatsApp();
      await sendSMS();
      setStep("sent");
    } catch (err) {
      console.error("EmailJS error:", err);
      setStep("error");
    }
  };

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
              { icon: <FaMapMarkerAlt className="text-gold" />, label: "Address", value: "Teachers colony Gayatri nagar road kunraghat , Gorakhpur , Uttar Pradesh - 273008" },
              { icon: <FaPhone className="text-gold" />,        label: "Phone",   value: "+91 8808085237" },
              { icon: <FaEnvelope className="text-gold" />,     label: "Email",   value: "kdutsavlawn@gmail.com" },
              { icon: <FaClock className="text-gold" />,        label: "Hours",   value: "Mon–Sun: 9:00 AM – 9:00 PM" },
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

        {/* Right Panel */}
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col justify-center">

          {/* STEP 1 — Form */}
          {step === "form" && (
            <>
              <h2 className="text-xl font-serif font-bold text-gray-800 mb-6">Send an Enquiry</h2>
              <div className="space-y-4">
                <div>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Your Name *" className="input-field w-full" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="Email Address" className="input-field w-full" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="Phone Number *" className="input-field w-full" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <textarea rows={4} name="message" value={form.message} onChange={handleChange}
                  placeholder="Your message..." className="input-field resize-none w-full" />
                <button onClick={handleSubmit}
                  className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold">
                  Review & Send Enquiry →
                </button>
              </div>
            </>
          )}

          {/* STEP 2 — Confirm */}
          {step === "confirm" && (
            <div className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-gray-800">Are details correct?</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
                <p><span className="font-semibold">Naam:</span> {form.name}</p>
                <p><span className="font-semibold">Phone:</span> {form.phone}</p>
                <p><span className="font-semibold">Email:</span> {form.email || "—"}</p>
                <p><span className="font-semibold">Message:</span> {form.message || "—"}</p>
              </div>

              <p className="text-xs text-gray-400 text-center">Send individually:</p>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={async () => { setStep("sending"); try { await sendEmail(); setStep("sent"); } catch { setStep("error"); } }}
                  className="py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium flex flex-col items-center gap-1 transition">
                  <MdEmail className="text-lg" /> Email Only
                </button>
                <button onClick={() => { sendToWhatsApp(); setStep("sent"); }}
                  className="py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-medium flex flex-col items-center gap-1 transition">
                  <FaWhatsapp className="text-lg" /> WhatsApp
                </button>
                <button onClick={() => { sendSMS(); setStep("sent"); }}
                  className="py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium flex flex-col items-center gap-1 transition">
                  <FaPhone className="text-lg" /> SMS Only
                </button>
              </div>

              <button onClick={sendAll}
                className="w-full py-3 rounded-xl btn-gold text-sm font-semibold tracking-wide">
                🚀 Send with all three
              </button>

              <button onClick={() => setStep("form")}
                className="w-full py-1 text-xs text-gray-400 underline">
                ← Return to the form
              </button>
            </div>
          )}

          {/* STEP 3 — Sending */}
          {step === "sending" && (
            <div className="text-center space-y-4 py-10">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 text-sm">Sending enquiry...</p>
            </div>
          )}

          {/* STEP 4 — Sent */}
          {step === "sent" && (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                ✅
              </div>
              <h2 className="text-xl font-serif font-bold text-gray-800">Thanks!</h2>
              <p className="text-gray-600 text-sm">
                Your enquiry has been successfully submitted. We will get in touch shortly!
              </p>
              <button
                onClick={() => { setForm({ name: "", email: "", phone: "", message: "" }); setStep("form"); }}
                className="text-xs text-gray-400 underline">
                Send another enquiry?
              </button>
            </div>
          )}

          {/* STEP 5 — Error */}
          {step === "error" && (
            <div className="text-center space-y-4 py-6">
              <div className="text-4xl">⚠️</div>
              <h2 className="text-xl font-serif font-bold text-gray-800">Email not sent</h2>
              <p className="text-gray-500 text-sm">Problem in EmailJs , please check the keys.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep("confirm")}
                  className="text-xs text-gray-400 underline">← Go back</button>
                <button onClick={() => { sendToWhatsApp(); setStep("sent"); }}
                  className="py-2 px-4 rounded-xl bg-green-500 text-white text-xs">
                  <FaWhatsapp className="inline mr-1" /> Send via WhatsApp
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}