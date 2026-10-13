import { useMemo } from "react";
import { useQuery } from "react-query";
import {
  FaCalendarCheck,
  FaUsers,
  FaImages,
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaChartPie,
  FaRupeeSign,
  FaCalendarAlt,
  FaWallet,
  FaSyncAlt,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import api from "../../services/api";

const STATUS_COLORS = {
  pending: "#F59E0B",
  confirmed: "#16A34A",
  rejected: "#DC2626",
  cancelled: "#6B7280",
  completed: "#2563EB",
};

const money = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const getArray = (value, paths = []) => {
  if (Array.isArray(value)) return value;
  for (const path of paths) {
    const found = path.split(".").reduce((current, key) => current?.[key], value);
    if (Array.isArray(found)) return found;
  }
  return [];
};

const firstNumber = (object, keys) => {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], object);
    if (value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return 0;
};

const getBookingDate = (booking) =>
  booking?.eventDate || booking?.bookingDate || booking?.createdAt || booking?.date || null;

const getBookingTotal = (booking) =>
  firstNumber(booking, ["payableAmount", "totalAmount", "finalAmount", "amount"]);

const getBookingPaid = (booking) =>
  firstNumber(booking, [
    "paidAmount",
    "advanceAmount",
    "amountPaid",
    "totalPaid",
    "paymentSummary.paidAmount",
  ]);

const getBookingRemaining = (booking) => {
  const explicit = firstNumber(booking, ["remainingAmount", "balanceAmount", "dueAmount"]);
  if (booking?.remainingAmount !== undefined || booking?.balanceAmount !== undefined || booking?.dueAmount !== undefined) {
    return Math.max(0, explicit);
  }
  return Math.max(0, getBookingTotal(booking) - getBookingPaid(booking));
};

function StatCard({ label, value, icon, color, hint }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div className={`shrink-0 rounded-xl p-3 text-lg text-white ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ children = "No data available for this chart." }) {
  return <div className="flex h-64 items-center justify-center px-4 text-center text-sm text-gray-500">{children}</div>;
}

export default function AdminHome() {
  const {
    data: statsResponse,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery("bookingStats", () =>
    api.get("/bookings/admin/stats").then((response) => response.data)
  );

  const { data: usersResponse, isLoading: usersLoading } = useQuery(
    "userCount",
    () => api.get("/users/admin/all?limit=1").then((response) => response.data)
  );

  const { data: galleryResponse, isLoading: galleryLoading } = useQuery(
    "galleryCount",
    () => api.get("/gallery/admin/all").then((response) => response.data)
  );

  const { data: packagesResponse, isLoading: packagesLoading } = useQuery(
    "pkgCount",
    () => api.get("/packages/admin/all").then((response) => response.data)
  );

  // Optional list endpoint: if the backend does not expose it, the dashboard
  // still works and shows a clear message instead of fabricated trend data.
  const {
    data: bookingsResponse,
    isLoading: bookingsLoading,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useQuery(
    "adminDashboardBookings",
    () => api.get("/bookings/admin/all?limit=500").then((response) => response.data),
    { retry: false }
  );

  const stats = statsResponse?.data || statsResponse || {};
  const statusStats = getArray(stats, ["stats", "data.stats"]);
  const bookings = getArray(bookingsResponse, [
    "bookings",
    "data.bookings",
    "data",
    "results",
  ]);

  const getCount = (status) =>
    Number(statusStats.find((item) => String(item?._id).toLowerCase() === status)?.count || 0);

  const totalBookings = Number(stats.total ?? stats.totalBookings ?? 0);
  const pendingCount = getCount("pending");
  const confirmedCount = getCount("confirmed");
  const completedCount = getCount("completed");
  const cancelledCount = getCount("cancelled");
  const rejectedCount = getCount("rejected");

  const userTotal = Number(
    usersResponse?.total ??
      usersResponse?.data?.total ??
      usersResponse?.count ??
      0
  );
  const galleryImages = getArray(galleryResponse, ["images", "data.images", "gallery", "data"]);
  const packageList = getArray(packagesResponse, ["packages", "data.packages", "data"]);

  const financials = useMemo(() => {
    if (!bookings.length) return { received: null, remaining: null, fullyPaid: null };
    const eligible = bookings.filter((booking) => !["rejected", "cancelled"].includes(String(booking?.status || "").toLowerCase()));
    return {
      received: eligible.reduce((sum, booking) => sum + getBookingPaid(booking), 0),
      remaining: eligible.reduce((sum, booking) => sum + getBookingRemaining(booking), 0),
      fullyPaid: eligible.filter((booking) => {
        const remaining = getBookingRemaining(booking);
        return String(booking?.paymentStatus || "").toLowerCase() === "fully_paid" || (getBookingTotal(booking) > 0 && remaining <= 0);
      }).length,
    };
  }, [bookings]);

  const totalRevenue = statusStats.reduce(
    (sum, item) => sum + Number(item?.revenue || 0),
    0
  );

  const pieData = statusStats
    .map((item) => ({
      name: String(item?._id || "Unknown").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      status: String(item?._id || "").toLowerCase(),
      value: Number(item?.count || 0),
    }))
    .filter((item) => item.value > 0);

  const revenueData = statusStats.map((item) => ({
    status: String(item?._id || "Unknown").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    revenue: Number(item?.revenue || 0),
  }));

  const monthlyData = useMemo(() => {
    if (!bookings.length) return [];
    const grouped = new Map();
    bookings.forEach((booking) => {
      const rawDate = getBookingDate(booking);
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = grouped.get(key) || { monthKey: key, bookings: 0, amount: 0 };
      current.bookings += 1;
      current.amount += getBookingTotal(booking);
      grouped.set(key, current);
    });
    return [...grouped.values()]
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6)
      .map((item) => {
        const [year, month] = item.monthKey.split("-");
        return {
          ...item,
          month: new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        };
      });
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings
      .filter((booking) => {
        const status = String(booking?.status || "").toLowerCase();
        const dateValue = getBookingDate(booking);
        if (!dateValue || ["rejected", "cancelled", "completed"].includes(status)) return false;
        const date = new Date(dateValue);
        return !Number.isNaN(date.getTime()) && date >= today;
      })
      .sort((a, b) => new Date(getBookingDate(a)) - new Date(getBookingDate(b)))
      .slice(0, 6);
  }, [bookings]);

  const cards = [
    { label: "Total Bookings", value: statsLoading ? "…" : totalBookings.toLocaleString("en-IN"), icon: <FaCalendarCheck />, color: "bg-blue-600", hint: "All booking statuses" },
    { label: "Pending Bookings", value: statsLoading ? "…" : pendingCount.toLocaleString("en-IN"), icon: <FaClock />, color: "bg-amber-500", hint: "Awaiting action" },
    { label: "Confirmed Bookings", value: statsLoading ? "…" : confirmedCount.toLocaleString("en-IN"), icon: <FaCheckCircle />, color: "bg-green-600", hint: "Confirmed events" },
    { label: "Completed Bookings", value: statsLoading ? "…" : completedCount.toLocaleString("en-IN"), icon: <FaCheckCircle />, color: "bg-indigo-600", hint: "Completed events" },
    { label: "Total Users", value: usersLoading ? "…" : userTotal.toLocaleString("en-IN"), icon: <FaUsers />, color: "bg-purple-600", hint: "Registered customers" },
    { label: "Gallery Images", value: galleryLoading ? "…" : galleryImages.length.toLocaleString("en-IN"), icon: <FaImages />, color: "bg-pink-600", hint: "Uploaded images" },
    { label: "Packages", value: packagesLoading ? "…" : packageList.length.toLocaleString("en-IN"), icon: <FaBoxOpen />, color: "bg-amber-700", hint: "Package records" },
    { label: "Status-wise Revenue", value: statsLoading ? "…" : money(totalRevenue), icon: <FaRupeeSign />, color: "bg-emerald-700", hint: "Revenue reported by stats API" },
    { label: "Amount Received", value: bookingsLoading ? "…" : financials.received === null ? "Unavailable" : money(financials.received), icon: <FaWallet />, color: "bg-teal-600", hint: "From returned booking records" },
    { label: "Remaining Balance", value: bookingsLoading ? "…" : financials.remaining === null ? "Unavailable" : money(financials.remaining), icon: <FaRupeeSign />, color: "bg-orange-600", hint: "From returned booking records" },
    { label: "Fully Paid Bookings", value: bookingsLoading ? "…" : financials.fullyPaid === null ? "Unavailable" : financials.fullyPaid.toLocaleString("en-IN"), icon: <FaCheckCircle />, color: "bg-cyan-700", hint: "Based on payment fields" },
    { label: "Rejected / Cancelled", value: statsLoading ? "…" : (rejectedCount + cancelledCount).toLocaleString("en-IN"), icon: <FaBan />, color: "bg-gray-600", hint: "Closed bookings" },
  ];

  const chartLoading = statsLoading;
  const noStatusData = !chartLoading && pieData.length === 0;

  const refreshAll = () => {
    refetchStats();
    refetchBookings();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">KD Utsav Lawn · Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Dashboard Overview</h1>
            <p className="mt-2 text-sm text-gray-500">Booking, customer, payment and business overview.</p>
          </div>
          <button type="button" onClick={refreshAll} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100">
            <FaSyncAlt /> Refresh dashboard
          </button>
        </div>

        {statsError && (
          <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Booking statistics could not be loaded. Please check the stats API.</span>
            <button type="button" onClick={() => refetchStats()} className="self-start rounded-lg border border-red-300 px-3 py-1.5 font-semibold hover:bg-red-100">Try again</button>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartPanel title="Booking Status Breakdown" subtitle="Number of bookings returned by the stats API">
            {chartLoading ? <EmptyChart>Loading booking chart…</EmptyChart> : noStatusData ? <EmptyChart>No booking status data available.</EmptyChart> : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={62} outerRadius={95} paddingAngle={3} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((item) => <Cell key={item.status} fill={STATUS_COLORS[item.status] || "#9CA3AF"} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Bookings"]} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartPanel>

          <ChartPanel title="Revenue by Booking Status" subtitle="Revenue totals reported for each status (₹)">
            {chartLoading ? <EmptyChart>Loading revenue chart…</EmptyChart> : revenueData.length === 0 ? <EmptyChart>No revenue data available.</EmptyChart> : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 12, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`} />
                    <Tooltip formatter={(value) => [money(value), "Revenue"]} labelFormatter={(label) => `Status: ${label}`} />
                    <Bar dataKey="revenue" name="Revenue" fill="#B7791F" radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartPanel>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartPanel title="Monthly Booking Trend" subtitle="Last six months represented in the booking list returned by the API">
            {bookingsLoading ? <EmptyChart>Loading monthly trend…</EmptyChart> : bookingsError ? <EmptyChart>Booking list API is unavailable. Monthly trend needs a working admin booking-list endpoint.</EmptyChart> : monthlyData.length === 0 ? <EmptyChart>No usable booking dates were returned by the API.</EmptyChart> : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartPanel>

          <ChartPanel title="Booking Value by Month" subtitle="Booking totals by event/booking date; not a cash collection chart">
            {bookingsLoading ? <EmptyChart>Loading monthly values…</EmptyChart> : bookingsError ? <EmptyChart>Booking list API is unavailable. Monthly value chart needs a working admin booking-list endpoint.</EmptyChart> : monthlyData.length === 0 ? <EmptyChart>No usable booking dates were returned by the API.</EmptyChart> : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 12, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`} />
                    <Tooltip formatter={(value) => [money(value), "Booking value"]} />
                    <Bar dataKey="amount" name="Booking value" fill="#16A34A" radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartPanel>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartPanel title="Upcoming Events" subtitle="Next six future events in the records returned by the booking API">
            {bookingsLoading ? <EmptyChart>Loading upcoming events…</EmptyChart> : bookingsError ? <EmptyChart>Booking list API is unavailable. Check the endpoint configured for admin bookings.</EmptyChart> : upcomingBookings.length === 0 ? <EmptyChart>No upcoming bookings found in the returned records.</EmptyChart> : (
              <div className="space-y-3">
                {upcomingBookings.map((booking, index) => {
                  const date = new Date(getBookingDate(booking));
                  const status = String(booking?.status || "unknown").toLowerCase();
                  return (
                    <div key={booking?._id || booking?.id || `${getBookingDate(booking)}-${index}`} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700"><FaCalendarAlt /></div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{booking?.contactName || booking?.user?.name || booking?.customerName || booking?.name || "Customer"}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{booking?.eventType || booking?.eventName || "Event"} · {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: `${STATUS_COLORS[status] || "#9CA3AF"}18`, color: STATUS_COLORS[status] || "#6B7280" }}>{status.replaceAll("_", " ")}</span>
                        <span className="text-sm font-semibold text-gray-800">{money(getBookingTotal(booking))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ChartPanel>

          <ChartPanel title="Booking Status Summary" subtitle="Counts and revenue reported by the backend">
            {statsLoading ? <EmptyChart>Loading status summary…</EmptyChart> : statusStats.length === 0 ? <EmptyChart>No status summary available.</EmptyChart> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500"><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 text-right font-semibold">Bookings</th><th className="px-3 py-3 text-right font-semibold">Revenue</th></tr></thead>
                  <tbody>
                    {statusStats.map((item) => {
                      const status = String(item?._id || "unknown").toLowerCase();
                      return (
                        <tr key={status} className="border-b border-gray-50 last:border-0">
                          <td className="px-3 py-3"><span className="inline-flex items-center gap-2 font-medium capitalize text-gray-800"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || "#9CA3AF" }} />{status.replaceAll("_", " ")}</span></td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-700">{Number(item?.count || 0).toLocaleString("en-IN")}</td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold text-gray-800">{money(item?.revenue)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ChartPanel>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Data accuracy note</p>
          <p className="mt-1 leading-relaxed">
            Summary charts use the current statistics API. Financial cards and monthly/upcoming panels use the booking-list API response. If that endpoint is unavailable or returns paginated data, those panels will show unavailable/no data rather than inventing figures. For fully accurate received-payment and outstanding totals, the backend should aggregate all booking payment transactions server-side.
          </p>
        </div>
      </div>
    </div>
  );
}
