import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { FaArrowLeft, FaFileDownload } from "react-icons/fa";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery(
    ["adminBooking", bookingId],
    () =>
      api
        .get(`/bookings/admin/${bookingId}`)
        .then((res) => res.data.booking)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">Booking not found.</p>
      </div>
    );
  }

  const totalAmount = Number(booking.totalAmount || 0);
  const advanceAmount = Number(booking.advanceAmount || 0);

  const remainingAmount = Math.max(
    totalAmount - advanceAmount,
    0
  );

  const isFullyPaid =
    remainingAmount === 0 ||
    booking.paymentStatus === "fully_paid";

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">

        <button
          onClick={() => navigate("/admin/bookings")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft />
          Back to Bookings
        </button>

        <button
          onClick={() => handleDownloadBill(booking)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-white"
        >
          <FaFileDownload />
          Download Bill
        </button>

      </div>

      {/* CUSTOMER */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

        <h2 className="text-xl font-bold text-gray-800 mb-5">
          Customer Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Name
            </p>
            <p className="font-semibold mt-1">
              {booking.contactName}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Phone
            </p>
            <p className="font-semibold mt-1">
              {booking.contactPhone}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Email
            </p>
            <p className="font-semibold mt-1">
              {booking.contactEmail || "-"}
            </p>
          </div>

        </div>
      </div>

      {/* BOOKING */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

        <h2 className="text-xl font-bold text-gray-800 mb-5">
          Booking Details
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Booking ID
            </p>
            <p className="font-semibold mt-1">
              #{booking._id.slice(-8).toUpperCase()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Event
            </p>
            <p className="font-semibold mt-1">
              {booking.eventType}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Event Date
            </p>
            <p className="font-semibold mt-1">
              {new Date(booking.eventDate).toDateString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Package
            </p>
            <p className="font-semibold mt-1">
              {booking.package?.name || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Guests
            </p>
            <p className="font-semibold mt-1">
              {booking.guestCount}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase">
              Booking Status
            </p>
            <p className="font-semibold mt-1 capitalize">
              {booking.status}
            </p>
          </div>

        </div>

      </div>

      {/* PAYMENT */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

        <h2 className="text-xl font-bold text-gray-800 mb-5">
          Payment Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase">
              Total Bill
            </p>
            <p className="text-2xl font-bold mt-2">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-5">
            <p className="text-xs text-green-600 uppercase">
              Advance Paid
            </p>
            <p className="text-2xl font-bold text-green-700 mt-2">
              ₹{advanceAmount.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-orange-50 rounded-xl p-5">
            <p className="text-xs text-orange-600 uppercase">
              Remaining
            </p>
            <p className="text-2xl font-bold text-orange-700 mt-2">
              ₹{remainingAmount.toLocaleString("en-IN")}
            </p>
          </div>

        </div>

        <div className="mt-5">

          <p className="text-sm text-gray-500">
            Payment Status
          </p>

          <span className="inline-block mt-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
            {isFullyPaid ? "Fully Paid" : booking.paymentStatus || "Unpaid"}
          </span>

        </div>

      </div>

      {/* RAZORPAY */}
      <div className="bg-white rounded-2xl shadow-sm p-6">

        <h2 className="text-xl font-bold text-gray-800 mb-5">
          Payment Transaction
        </h2>

        <div className="space-y-3 text-sm">

          <p>
            <strong>Razorpay Order ID:</strong>{" "}
            {booking.razorpayOrderId || "-"}
          </p>

          <p>
            <strong>Razorpay Payment ID:</strong>{" "}
            {booking.razorpayPaymentId || "-"}
          </p>

        </div>

      </div>

    </div>
  );
}