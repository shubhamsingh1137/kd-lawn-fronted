import { useState } from "react";
import { useQuery } from "react-query";
import api from "../services/api";

const CATEGORIES = ["all", "wedding", "reception", "decoration", "food", "venue", "other"];

export default function Gallery() {
  const [active, setActive] = useState("all");
  const { data, isLoading } = useQuery(
    ["gallery", active],
    () => api.get(`/gallery${active !== "all" ? `?category=${active}` : ""}`).then(r => r.data.images)
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white py-20 text-center">
        <p className="section-subtitle text-gold">Our Portfolio</p>
        <h1 className="section-title text-white">Event Gallery</h1>
        <p className="text-gray-400 max-w-xl mx-auto mt-2 text-sm">
          Explore moments from weddings, receptions and celebrations hosted at Kalawati Marriage Lawn.
        </p>
      </div>

      {/* Category filter */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-colors
                ${active === cat ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gold/10"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No images in this category yet.</p>
        ) : (
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {data?.map((img) => (
              <div key={img._id} className="break-inside-avoid overflow-hidden rounded-xl group">
                <img
                  src={img.imageUrl} alt={img.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
