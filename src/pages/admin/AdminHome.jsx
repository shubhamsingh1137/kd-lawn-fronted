import { useMemo } from "react";
import { useQuery } from "react-query";
import Swal from "sweetalert2";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarCheck,
  FaUsers,
  FaImages,
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaRupeeSign,
  FaCalendarAlt,
  FaWallet,
  FaSyncAlt,
  FaPlus,
  FaList,
  FaUserFriends,
  FaArrowRight,
  FaMapMarkerAlt,
} from "react-icons/fa";
import api from "../../services/api";

const STATUS_COLORS = {
  pending: "#F59E0B",
  confirmed: "#16A34A",
  rejected: "#DC2626",
  cancelled: "#64748B",
  completed: "#2563EB",
};

const money = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const getArray = (value, paths = []) => {
  if (Array.isArray(value)) return value;

  for (const path of paths) {
    const result = path
      .split(".")
      .reduce((current, key) => current?.[key], value);

    if (Array.isArray(result)) return result;
  }

  return [];
};

const getNumber = (object, keys) => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((current, part) => current?.[part], object);

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
};

const getBookingDate = (booking) =>
  booking?.eventDate ||
  booking?.bookingDate ||
  booking?.createdAt ||
  booking?.date ||
  null;

const getBookingTotal = (booking) =>
  getNumber(booking, [
    "payableAmount",
    "totalAmount",
    "finalAmount",
    "amount",
  ]);

const getBookingPaid = (booking) =>
  getNumber(booking, [
    "paidAmount",
    "advanceAmount",
    "amountPaid",
    "totalPaid",
    "paymentSummary.paidAmount",
  ]);

const getBookingRemaining = (booking) => {
  const hasRemaining =
    booking?.remainingAmount !== undefined ||
    booking?.balanceAmount !== undefined ||
    booking?.dueAmount !== undefined;

  if (hasRemaining) {
    return Math.max(
      0,
      getNumber(booking, [
        "remainingAmount",
        "balanceAmount",
        "dueAmount",
      ])
    );
  }

  return Math.max(
    0,
    getBookingTotal(booking) - getBookingPaid(booking)
  );
};

function StatCard({ label, value, icon, theme, note }) {
  const themes = {
    rose: "bg-rose-50 text-rose-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {note}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-2xl p-3 text-xl ${
            themes[theme] || themes.blue
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, action, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <span className="text-amber-700">{icon}</span>
          {title}
        </h2>

        {action}
      </div>

      {children}
    </section>
  );
}

function StatusCard({ title, count, subtitle, color, icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <span style={{ color }} className="text-lg">
          {icon}
        </span>

        <span className="text-xs font-semibold text-slate-600 sm:text-sm">
          {title}
        </span>
      </div>

      <p className="mt-2 text-2xl font-extrabold text-slate-900">
        {count}
      </p>

      <p className="mt-1 text-xs font-medium" style={{ color }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();

  // Booking statistics
  const {
    data: statsResponse,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery("bookingStats", () =>
    api
      .get("/bookings/admin/stats")
      .then((response) => response.data)
  );

  // Customers
  const {
    data: usersResponse,
    isLoading: usersLoading,
  } = useQuery("userCount", () =>
    api
      .get("/users/admin/all?limit=1")
      .then((response) => response.data)
  );

  // Gallery
  const {
    data: galleryResponse,
    isLoading: galleryLoading,
  } = useQuery("galleryCount", () =>
    api
      .get("/gallery/admin/all")
      .then((response) => response.data)
  );

  // Packages
  const {
    data: packagesResponse,
    isLoading: packagesLoading,
  } = useQuery("pkgCount", () =>
    api
      .get("/packages/admin/all")
      .then((response) => response.data)
  );

  // Booking list
  const {
    data: bookingsResponse,
    isLoading: bookingsLoading,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useQuery(
    "adminDashboardBookings",
    () =>
      api
        .get("/bookings/admin/all?limit=500")
        .then((response) => response.data),
    { retry: false }
  );

  const stats = statsResponse?.data || statsResponse || {};

  const statusStats = getArray(stats, [
    "stats",
    "data.stats",
  ]);

  const bookings = getArray(bookingsResponse, [
    "bookings",
    "data.bookings",
    "data",
    "results",
  ]);

  const countFor = (status) =>
    Number(
      statusStats.find(
        (item) =>
          String(item?._id || "").toLowerCase() === status
      )?.count || 0
    );

  const totalBookings = Number(
    stats.total ??
      stats.totalBookings ??
      statusStats.reduce(
        (sum, item) => sum + Number(item?.count || 0),
        0
      )
  );

  const pendingCount = countFor("pending");
  const confirmedCount = countFor("confirmed");
  const rejectedCount = countFor("rejected");
  const cancelledCount = countFor("cancelled");

  const userTotal = Number(
    usersResponse?.total ??
      usersResponse?.data?.total ??
      usersResponse?.count ??
      getArray(usersResponse, [
        "users",
        "data.users",
        "data",
      ]).length
  );

  const galleryImages = getArray(galleryResponse, [
    "images",
    "data.images",
    "gallery",
    "data",
  ]);

  const packageList = getArray(packagesResponse, [
    "packages",
    "data.packages",
    "data",
  ]);

  // Payment summary based on returned booking records
  const financials = useMemo(() => {
    const eligible = bookings.filter(
      (booking) =>
        !["rejected", "cancelled"].includes(
          String(booking?.status || "").toLowerCase()
        )
    );

    return {
      received: eligible.reduce(
        (sum, booking) => sum + getBookingPaid(booking),
        0
      ),

      remaining: eligible.reduce(
        (sum, booking) => sum + getBookingRemaining(booking),
        0
      ),
    };
  }, [bookings]);

  const totalRevenue = statusStats.reduce(
    (sum, item) => sum + Number(item?.revenue || 0),
    0
  );

  // Upcoming events
  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings
      .filter((booking) => {
        const status = String(
          booking?.status || ""
        ).toLowerCase();

        const rawDate = getBookingDate(booking);

        if (
          !rawDate ||
          ["rejected", "cancelled", "completed"].includes(status)
        ) {
          return false;
        }

        const date = new Date(rawDate);

        return (
          !Number.isNaN(date.getTime()) &&
          date >= today
        );
      })
      .sort(
        (a, b) =>
          new Date(getBookingDate(a)) -
          new Date(getBookingDate(b))
      )
      .slice(0, 3);
  }, [bookings]);
  // Cancelled bookings
const cancelledBookings = useMemo(() => {
  return bookings
    .filter(
      (booking) =>
        String(booking?.status || "").toLowerCase() === "cancelled"
    )
    .sort(
      (a, b) =>
        new Date(getBookingDate(b) || 0) -
        new Date(getBookingDate(a) || 0)
    );
}, [bookings]);

  const statusCards = [
    {
      title: "Confirmed Bookings",
      count: confirmedCount,
      subtitle: "Confirmed events",
      color: "#059669",
      icon: <FaCheckCircle />,
    },
    {
      title: "Pending Bookings",
      count: pendingCount,
      subtitle: "Awaiting action",
      color: "#D97706",
      icon: <FaClock />,
    },
    {
      title: "Rejected Bookings",
      count: rejectedCount,
      subtitle: "Rejected events",
      color: "#E11D48",
      icon: <FaTimesCircle />,
    },
    {
      title: "Cancelled Bookings",
      count: cancelledCount,
      subtitle: "Cancelled events",
      color: "#64748B",
      icon: <FaBan />,
    },
  ];

  const refreshAll = () => {
    refetchStats();
    refetchBookings();
  };
  // Delete cancelled booking
const handleDeleteCancelledBooking = async (booking) => {
  const result = await Swal.fire({
    title: "Delete Cancelled Booking?",
    text: `Booking of ${booking.contactName || "this customer"} will be permanently deleted. This cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await api.delete(`/bookings/admin/${booking._id}`);

    await refetchBookings();
    await refetchStats();

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Cancelled booking has been deleted.",
      confirmButtonColor: "#c58b00",
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text:
        error.response?.data?.message ||
        "Unable to delete booking.",
      confirmButtonColor: "#dc2626",
    });
  }
};

  const showValue = (loading, value) =>
    loading ? "…" : value;

  return (
    <div className="min-h-screen bg-[#f7f5f2] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1500px] space-y-5">

        {/* Dashboard Header */}
        <header className="flex flex-col gap-4 rounded-2xl border border-white bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              KD Utsav Lawn · Admin Panel
            </p>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard Overview
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Your bookings, payments and upcoming events at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              {new Date().toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </span>

            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FaSyncAlt />
              Refresh Dashboard
            </button>
          </div>
        </header>

        {/* API Error */}
        {statsError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            Booking statistics load nahi ho paaye.
            API endpoint check karein.

            <button
              type="button"
              onClick={() => refetchStats()}
              className="ml-3 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Summary Cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Bookings"
            value={showValue(
              statsLoading,
              totalBookings.toLocaleString("en-IN")
            )}
            icon={<FaCalendarCheck />}
            theme="rose"
            note="All booking statuses"
          />

          <StatCard
            label="Total Booking Value"
            value={showValue(
              statsLoading,
              money(totalRevenue)
            )}
            icon={<FaRupeeSign />}
            theme="green"
            note="Value reported by stats API"
          />

          <StatCard
            label="Amount Received"
            value={showValue(
              bookingsLoading,
              money(financials.received)
            )}
            icon={<FaWallet />}
            theme="blue"
            note="Recorded payments"
          />

          <StatCard
            label="Pending Balance"
            value={showValue(
              bookingsLoading,
              money(financials.remaining)
            )}
            icon={<FaClock />}
            theme="amber"
            note="Amount yet to collect"
          />
        </section>

        {/* Upcoming Events + Booking Status */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
          <Panel
            title={`Upcoming Events (${upcomingBookings.length})`}
            icon={<FaCalendarAlt />}
            action={
              <button
                type="button"
                onClick={() => navigate("/admin/bookings")}
                className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-900"
              >
                View All <FaArrowRight className="text-xs" />
              </button>
            }
          >
            {bookingsLoading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Loading upcoming events…
              </div>
            ) : bookingsError ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Booking list load nahi hui. Admin bookings API check karein.
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
                Abhi koi upcoming event nahi mila.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {upcomingBookings.map((booking, index) => {
                  const date = new Date(getBookingDate(booking));

                  const status = String(
                    booking?.status || "pending"
                  ).toLowerCase();

                  return (
                    <button
                      type="button"
                      key={
                        booking?._id ||
                        booking?.id ||
                        `${getBookingDate(booking)}-${index}`
                      }
                      onClick={() =>
                        booking?._id &&
                        navigate(`/admin/bookings/${booking._id}`)
                      }
                      className="group overflow-hidden rounded-xl border border-slate-100 bg-white text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                    >
                     
{/* Wedding Image + Event Date */}
<div className="relative h-28 overflow-hidden">
  <img
    src="/images/wedding.jpeg"
    alt="KD Utsav Lawn Wedding"
    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
  />

  {/* Image overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

  {/* Event date badge */}
  <div className="absolute left-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-white shadow-md">
    <span className="text-lg font-extrabold leading-5 text-slate-900">
      {date.toLocaleDateString("en-IN", {
        day: "2-digit",
      })}
    </span>

    <span className="text-[10px] font-bold uppercase text-amber-700">
      {date.toLocaleDateString("en-IN", {
        month: "short",
      })}
    </span>
  </div>

  {/* Event year */}
  <span className="absolute bottom-2 right-3 rounded-md bg-black/45 px-2 py-1 text-xs font-semibold text-white">
    {date.toLocaleDateString("en-IN", {
      year: "numeric",
    })}
  </span>
</div>


                      <div className="space-y-2 p-3">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {booking?.contactName ||
                            booking?.user?.name ||
                            booking?.customerName ||
                            booking?.name ||
                            "Customer"}
                        </p>

                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <FaUsers />
                            {booking?.guestCount ??
                              booking?.numberOfGuests ??
                              "—"} guests
                          </span>

                          <span className="font-bold text-slate-900">
                            {money(getBookingTotal(booking))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 truncate text-xs text-slate-500">
                            <FaMapMarkerAlt />
                            KD Utsav Lawn
                          </span>

                          <span
                            className="rounded-full px-2 py-1 text-[10px] font-bold capitalize"
                            style={{
                              color: STATUS_COLORS[status] || "#64748B",
                              backgroundColor: `${
                                STATUS_COLORS[status] || "#64748B"
                              }18`,
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel
            title="Booking Status"
            icon={<FaCheckCircle />}
          >
            <div className="grid grid-cols-2 gap-3">
              {statusCards.map((item) => (
                <StatusCard
                  key={item.title}
                  {...item}
                />
              ))}
            </div>
          </Panel>
        </section>

{/* COMPLETE CANCELLED BOOKING HISTORY */}
<Panel
  title={`Cancelled Booking History (${cancelledBookings.length})`}
  icon={<FaBan />}
  action={
    <button
      type="button"
      onClick={() => navigate("/admin/bookings")}
      className="text-sm font-bold text-amber-700 hover:text-amber-900"
    >
      Manage Bookings →
    </button>
  }
>
  {bookingsLoading ? (
    <p className="py-8 text-center text-slate-500">
      Loading cancelled bookings...
    </p>
  ) : bookingsError ? (
    <p className="py-8 text-center text-rose-600">
      Unable to load cancelled bookings.
    </p>
  ) : cancelledBookings.length === 0 ? (
    <p className="py-8 text-center text-slate-500">
      No cancelled bookings found.
    </p>
  ) : (
    <div className="space-y-5">
      {cancelledBookings.map((booking) => {
        const cancellation = booking.cancellationDetails || {};

        const customerName =
          booking.contactName ||
          booking.user?.name ||
          booking.customerName ||
          "Customer";

        const phone =
          booking.contactPhone ||
          booking.user?.phone ||
          booking.phone ||
          "—";

        const createdAt = booking.createdAt
          ? new Date(booking.createdAt)
          : null;

        const cancelledAt = cancellation.cancelledAt
          ? new Date(cancellation.cancelledAt)
          : null;

        const eventDate = booking.eventDate
          ? new Date(booking.eventDate)
          : null;

        const validDate = (date) =>
          date && !Number.isNaN(date.getTime())
            ? date.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Not available";

        const originalAmount = getNumber(booking, [
          "originalAmount",
          "package.price",
          "totalAmount",
        ]);

        const discount = getNumber(booking, [
          "discountAmount",
        ]);

        const payable = getBookingTotal(booking);

        const paid = getNumber(cancellation, [
          "amountPaidAtCancellation",
        ]);

        const nonRefundable = getNumber(cancellation, [
          "nonRefundableAmount",
        ]);

        const officeSettlement = getNumber(cancellation, [
          "amountToSettle",
        ]);

        const settledAmount = getNumber(cancellation, [
          "settledAmount",
        ]);

        const remaining = Math.max(payable - paid, 0);

        return (
          <div
            key={booking._id}
            className="overflow-hidden rounded-xl border border-rose-200 bg-white"
          >
            {/* CUSTOMER HEADER */}
            <div className="flex flex-col justify-between gap-3 bg-rose-50 p-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {customerName}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Phone: {phone}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Booking ID:{" "}
                  {booking.bookingNumber || booking._id}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold uppercase text-rose-700">
                  Cancelled
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteCancelledBooking(booking)
                  }
                  title="Delete cancelled booking"
                  aria-label="Delete cancelled booking"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-600 hover:text-white"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4">

              {/* BOOKING TIMELINE */}
              <div>
                <h4 className="mb-3 font-bold text-slate-800">
                  Booking Timeline
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Booking Created
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {validDate(createdAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Event Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {validDate(eventDate)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-rose-50 p-3">
                    <p className="text-xs text-rose-600">
                      Booking Cancelled
                    </p>
                    <p className="mt-1 text-sm font-semibold text-rose-700">
                      {validDate(cancelledAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* EVENT DETAILS */}
              <div>
                <h4 className="mb-3 font-bold text-slate-800">
                  Booking Details
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Event Type
                    </p>
                    <p className="font-semibold text-slate-800">
                      {booking.eventType || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Package
                    </p>
                    <p className="font-semibold text-slate-800">
                      {booking.package?.name ||
                        booking.packageName ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Guest Count
                    </p>
                    <p className="font-semibold text-slate-800">
                      {booking.guestCount ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* PAYMENT BREAKDOWN */}
              <div>
                <h4 className="mb-3 font-bold text-slate-800">
                  Payment & Financial Breakdown
                </h4>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Original Amount
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {money(originalAmount)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Discount
                    </p>
                    <p className="mt-1 font-bold text-amber-700">
                      {money(discount)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Payable Amount
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {money(payable)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-slate-500">
                      Paid at Cancellation
                    </p>
                    <p className="mt-1 font-bold text-emerald-700">
                      {money(paid)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-rose-50 p-3">
                    <p className="text-xs text-slate-500">
                      Non-refundable
                    </p>
                    <p className="mt-1 font-bold text-rose-700">
                      {money(nonRefundable)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs text-slate-500">
                      Office Settlement
                    </p>
                    <p className="mt-1 font-bold text-amber-700">
                      {money(officeSettlement)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-xs text-slate-500">
                      Settled Amount
                    </p>
                    <p className="mt-1 font-bold text-blue-700">
                      {money(settledAmount)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Unpaid Booking Balance
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {money(remaining)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CANCELLATION INFORMATION */}
              <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                <h4 className="font-bold text-slate-800">
                  Cancellation Information
                </h4>

                <p className="mt-2 text-sm text-slate-600">
                  Reason:{" "}
                  <span className="font-medium text-slate-900">
                    {cancellation.reason || "No reason provided"}
                  </span>
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Settlement Status:{" "}
                  <span className="font-bold capitalize text-amber-700">
                    {cancellation.settlementStatus || "Not available"}
                  </span>
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Cancelled By:{" "}
                  <span className="font-medium text-slate-900">
                    {cancellation.cancelledBy?.name ||
                      cancellation.cancelledBy ||
                      "Not available"}
                  </span>
                </p>
              </div>

              {/* REVENUE IMPACT */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h4 className="font-bold text-slate-800">
                  Revenue Impact
                </h4>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Cancelled Booking Value
                    </p>
                    <p className="font-bold text-slate-900">
                      {money(payable)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Non-refundable Policy Amount
                    </p>
                    <p className="font-bold text-rose-700">
                      {money(nonRefundable)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Pending Settlement
                    </p>
                    <p className="font-bold text-amber-700">
                      {money(
                        Math.max(officeSettlement - settledAmount, 0)
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Cancelled booking value is excluded from active
                  booking revenue. Non-refundable amount is shown
                  separately and should not be treated as received
                  revenue until your accounting confirms it.
                </p>
              </div>

              {/* REPLACEMENT INFORMATION */}
              <div className="rounded-lg border border-slate-200 p-3">
                <h4 className="font-bold text-slate-800">
                  Replacement Booking
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  Replacement booking information is not available
                  in the current booking record.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  A replacement booking reference and amount need
                  to be saved by the backend to calculate this.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/bookings?bookingId=${booking._id}`)
                  }
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                >
                  Open in Manage Bookings
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</Panel>
        {/* Quick Actions */}
        <Panel
          title="Quick Actions"
          icon={<FaSyncAlt />}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => navigate("/admin/walk-in-booking")}
              className="flex items-center justify-center gap-3 rounded-xl bg-emerald-600 px-4 py-4 font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <FaPlus className="text-lg" />
              New Booking
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/bookings")}
              className="flex items-center justify-center gap-3 rounded-xl bg-amber-50 px-4 py-4 font-bold text-amber-900 ring-1 ring-amber-100 transition hover:bg-amber-100"
            >
              <FaList className="text-lg" />
              View All Bookings
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="flex items-center justify-center gap-3 rounded-xl bg-rose-50 px-4 py-4 font-bold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
            >
              <FaUserFriends className="text-lg" />
              Manage Customers
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/gallery")}
              className="flex items-center justify-center gap-3 rounded-xl bg-violet-50 px-4 py-4 font-bold text-violet-700 ring-1 ring-violet-100 transition hover:bg-violet-100"
            >
              <FaImages className="text-lg" />
              Manage Gallery
            </button>
          </div>
        </Panel>

        {/* Other Overview Cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total Customers"
            value={showValue(
              usersLoading,
              userTotal.toLocaleString("en-IN")
            )}
            icon={<FaUsers />}
            theme="blue"
            note="Registered users"
          />

          <StatCard
            label="Gallery Images"
            value={showValue(
              galleryLoading,
              galleryImages.length.toLocaleString("en-IN")
            )}
            icon={<FaImages />}
            theme="rose"
            note="Uploaded images"
          />

          <StatCard
            label="Packages"
            value={showValue(
              packagesLoading,
              packageList.length.toLocaleString("en-IN")
            )}
            icon={<FaBoxOpen />}
            theme="amber"
            note="Available package records"
          />
        </section>

        <p className="text-xs leading-relaxed text-slate-400">
          Dashboard figures are based on the records returned by your
          current APIs. For exact totals across all paginated bookings
          and payment transactions, the backend should provide
          server-side aggregate totals.
        </p>
      </div>
    </div>
  );
}