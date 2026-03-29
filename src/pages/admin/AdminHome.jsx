import { useQuery } from "react-query";
import api from "../../services/api";
import { FaCalendarCheck, FaUsers, FaImages, FaBoxOpen } from "react-icons/fa";

export default function AdminHome() {
  const { data: stats } = useQuery("bookingStats", () =>
    api.get("/bookings/admin/stats").then(r => r.data)
  );
  const { data: users } = useQuery("userCount", () =>
    api.get("/users/admin/all?limit=1").then(r => r.data.total)
  );
  const { data: gallery } = useQuery("galleryCount", () =>
    api.get("/gallery/admin/all").then(r => r.data.images?.length)
  );
  const { data: packages } = useQuery("pkgCount", () =>
    api.get("/packages/admin/all").then(r => r.data.packages?.length)
  );

  const getCount = (status) =>
    stats?.stats?.find(s => s._id === status)?.count || 0;

  const cards = [
    { label: "Total Bookings", value: stats?.total || 0,   icon: <FaCalendarCheck/>, color: "bg-blue-500" },
    { label: "Pending",        value: getCount("pending"),  icon: <FaCalendarCheck/>, color: "bg-yellow-500" },
    { label: "Confirmed",      value: getCount("confirmed"),icon: <FaCalendarCheck/>, color: "bg-green-500" },
    { label: "Total Users",    value: users || 0,           icon: <FaUsers/>,         color: "bg-purple-500" },
    { label: "Gallery Images", value: gallery || 0,         icon: <FaImages/>,        color: "bg-pink-500" },
    { label: "Packages",       value: packages || 0,        icon: <FaBoxOpen/>,       color: "bg-gold" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        {cards.map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-xl text-xl`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent booking stats breakdown */}
      {stats?.stats && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Status Breakdown</h2>
          <div className="space-y-3">
            {stats.stats.map(s => (
              <div key={s._id} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium text-gray-700">{s._id}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{s.count} bookings</span>
                  <span className="text-gold font-semibold">₹{s.revenue?.toLocaleString("en-IN") || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
