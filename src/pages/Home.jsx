import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import api from "../services/api";
import { FaStar, FaCheckCircle, FaArrowRight } from "react-icons/fa";

// ─── Fetch helpers ────────────────────────────────────────────────────────────
const fetchHome         = () => api.get("/content/home").then(r => r.data.content);
const fetchGallery      = () => api.get("/gallery?limit=6").then(r => r.data.images);
const fetchPackages     = () => api.get("/packages").then(r => r.data.packages);
const fetchTestimonials = () => api.get("/content/testimonials").then(r => r.data.testimonials);

// ─── Section: Hero ────────────────────────────────────────────────────────────
function HeroSection({ data }) {
  const title    = data?.title       || "Your Dream Wedding Starts Here";
  const subtitle = data?.subtitle    || "Kalawati Marriage Lawn";
  const desc     = data?.description || "A majestic venue where every celebration becomes an unforgettable memory.";
  const btnText  = data?.buttonText  || "Book Your Date";
  const bg       = data?.imageUrl    || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600";

  return (
    <section
      className="relative min-h-screen flex items-center justify-center text-white"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
  <div className="inline-flex items-center gap-3 mb-5">
  <span className="block w-8 h-px bg-yellow-400/70" />
  <p className="text-yellow-400 tracking-[0.1em] uppercase text-xl md:text-2xl font-semibold">
    {subtitle}
  </p>
  <span className="block w-8 h-px bg-yellow-400/70" />
</div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-6">{title}</h1>
        <p className="text-gray-200 text-lg mb-8 leading-relaxed">{desc}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/booking" className="btn-gold text-base px-8 py-4 rounded-lg">{btnText}</Link>
          <Link to="/gallery" className="btn-outline-gold text-base px-8 py-4 rounded-lg border-white text-white hover:bg-white hover:text-gray-900">
            View Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Section: About ───────────────────────────────────────────────────────────
function AboutSection({ data }) {
  const title = data?.title       || "About Kalawati Marriage Lawn";
  const desc  = data?.description || "With decades of experience hosting weddings and celebrations, Kalawati Marriage Lawn offers a breathtaking venue with world-class amenities, impeccable service, and unforgettable ambience.";
  const img   = data?.imageUrl    || "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800";

  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="section-subtitle">Our Story</p>
          <h2 className="section-title">{title}</h2>
          <p className="text-gray-600 leading-relaxed mb-6">{desc}</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[["500+","Events Hosted"],["15+","Years Experience"],["50+","Staff Members"],["4.9★","Average Rating"]].map(([num,label])=>(
              <div key={label} className="text-center bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-gold">{num}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <Link to="/about" className="btn-gold inline-flex items-center gap-2">
            Learn More <FaArrowRight size={14}/>
          </Link>
        </div>
        <img src={img} alt="About" className="rounded-2xl shadow-xl w-full h-96 object-cover"/>
      </div>
    </section>
  );
}

// ─── Section: Gallery preview ─────────────────────────────────────────────────
function GallerySection({ images }) {
  if (!images?.length) return null;
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-subtitle">Our Moments</p>
          <h2 className="section-title">A Glimpse of the Magic</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.slice(0, 6).map((img) => (
            <div key={img._id} className="overflow-hidden rounded-xl group cursor-pointer">
              <img
                src={img.imageUrl} alt={img.title}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/gallery" className="btn-outline-gold">View Full Gallery</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Packages ────────────────────────────────────────────────────────
function PackagesSection({ packages }) {
  if (!packages?.length) return null;
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-subtitle">Choose Your Plan</p>
          <h2 className="section-title">Our Packages</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg._id}
              className={`card p-8 flex flex-col ${pkg.isFeatured ? "ring-2 ring-gold shadow-xl scale-105" : ""}`}
            >
              {pkg.isFeatured && (
                <span className="bg-gold text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4">Popular</span>
              )}
              <h3 className="text-xl font-serif font-bold text-gray-800 mb-2">{pkg.name}</h3>
              <p className="text-3xl font-bold text-gold mb-1">
                ₹{pkg.price.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-gray-400 mb-6">Per event · {pkg.capacity.min}–{pkg.capacity.max} guests</p>
              <ul className="space-y-2 mb-8 flex-1">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <FaCheckCircle className="text-gold mt-0.5 shrink-0" size={14}/> {f}
                  </li>
                ))}
              </ul>
              <Link to="/booking" className={pkg.isFeatured ? "btn-gold text-center" : "btn-outline-gold text-center"}>
                Book This Package
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Testimonials ────────────────────────────────────────────────────
function TestimonialsSection({ testimonials }) {
  if (!testimonials?.length) return null;
  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-subtitle text-gold">Happy Couples</p>
          <h2 className="section-title text-white">What Our Clients Say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t._id} className="bg-gray-800 rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <FaStar key={i} className="text-gold" size={14}/>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.message}"</p>
              <div className="flex items-center gap-3">
                {t.imageUrl
                  ? <img src={t.imageUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover"/>
                  : <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-bold">
                      {t.name[0]}
                    </div>
                }
                <div>
                  <p className="font-semibold text-sm text-white">{t.name}</p>
                  {t.eventType && <p className="text-xs text-gray-400">{t.eventType}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: CTA ─────────────────────────────────────────────────────────────
function CTASection({ data }) {
  return (
    <section className="py-20 bg-gold text-white text-center">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
          {data?.title || "Ready to Plan Your Perfect Wedding?"}
        </h2>
        <p className="text-white/80 mb-8 text-lg">
          {data?.description || "Book your date today and let us make your dream come true."}
        </p>
        <Link to="/booking" className="bg-white text-gold font-bold px-10 py-4 rounded-lg hover:bg-cream transition-colors text-lg">
          Book Now
        </Link>
      </div>
    </section>
  );
}

// ─── Main Home page ───────────────────────────────────────────────────────────
export default function Home() {
  const { data: content      } = useQuery("homeContent",    fetchHome);
  const { data: gallery      } = useQuery("homeGallery",    fetchGallery);
  const { data: packages     } = useQuery("homePackages",   fetchPackages);
  const { data: testimonials } = useQuery("testimonials",   fetchTestimonials);

  return (
    <>
      <HeroSection        data={content?.hero} />
      <AboutSection       data={content?.about} />
      <GallerySection     images={gallery} />
      <PackagesSection    packages={packages} />
      <TestimonialsSection testimonials={testimonials} />
      <CTASection         data={content?.cta} />
    </>
  );
}
