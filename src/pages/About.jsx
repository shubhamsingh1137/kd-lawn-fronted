export default function About() {
  return (
    <div className="min-h-screen">
      <div className="bg-gray-900 text-white py-20 text-center">
        <p className="section-subtitle text-gold">Our Story</p>
        <h1 className="section-title text-white">About Kalawati Marriage Lawn</h1>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600 leading-relaxed text-lg mb-6">
          Kalawati Marriage Lawn has been the premier wedding venue in Kanpur for over 15 years. Our sprawling lawns, grand banquet halls, and dedicated staff ensure every event is a masterpiece of celebration.
        </p>
        <p className="text-gray-600 leading-relaxed mb-6">
          We offer comprehensive event packages tailored to suit every budget, culture, and vision. From intimate engagements to grand wedding receptions with 1000+ guests, we handle it all with grace and professionalism.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { title:"Our Vision",  text:"To be the most loved wedding destination in Uttar Pradesh." },
            { title:"Our Mission", text:"Creating flawless celebrations that become cherished memories." },
            { title:"Our Values",  text:"Integrity, elegance, and exceptional service in every event." },
          ].map(c => (
            <div key={c.title} className="bg-cream rounded-2xl p-6">
              <h3 className="font-serif font-bold text-gray-800 text-lg mb-2">{c.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
