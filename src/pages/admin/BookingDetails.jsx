import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import {
  FaArrowLeft,
  FaFileDownload,
} from "react-icons/fa";
import api from "../../services/api";


export default function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  // =========================================================
  // GET BOOKING DETAILS
  // =========================================================
  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useQuery(
    ["adminBooking", bookingId],
    () =>
      api
        .get(`/bookings/admin/${bookingId}`)
        .then((res) => res.data.booking),
    {
      enabled: !!bookingId,
    }
  );


  // =========================================================
  // LOADING
  // =========================================================
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================
  if (isError) {
    console.error("Booking details error:", error);

    return (
      <div className="p-10 text-center">

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-lg mx-auto">

          <h2 className="text-lg font-semibold text-red-700 mb-2">
            Unable to Load Booking
          </h2>

          <p className="text-sm text-red-600 mb-4">
            {error?.response?.data?.message ||
              error?.message ||
              "Failed to load booking details."}
          </p>

          <button
            onClick={() => navigate("/admin/bookings")}
            className="px-5 py-2.5 rounded-xl bg-gold text-white text-sm font-medium"
          >
            Back to Bookings
          </button>

        </div>

      </div>
    );
  }


  // =========================================================
  // BOOKING NOT FOUND
  // =========================================================
  if (!booking) {
    return (
      <div className="p-10 text-center">

        <p className="text-gray-500 mb-4">
          Booking not found.
        </p>

        <button
          onClick={() => navigate("/admin/bookings")}
          className="px-5 py-2.5 rounded-xl bg-gold text-white text-sm font-medium"
        >
          Back to Bookings
        </button>

      </div>
    );
  }


  // =========================================================
  // AMOUNT CALCULATION
  // =========================================================

  const totalAmount = Number(
    booking.totalAmount || 0
  );


  // Only successful payments count
  const successfulPayments =
    Array.isArray(booking.paymentHistory)
      ? booking.paymentHistory.filter(
          (payment) => payment.status === "success"
        )
      : [];


  // Total of all successful partial payments
  const totalPaid = successfulPayments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );


  // Remaining amount
  const remainingAmount = Math.max(
    totalAmount - totalPaid,
    0
  );


  // Fully paid if nothing remains
  const isFullyPaid = remainingAmount === 0;


  // Payment status for display
  const displayPaymentStatus = isFullyPaid
    ? "Fully Paid"
    : totalPaid > 0
    ? "Partially Paid"
    : "Unpaid";


  // =========================================================
  // DOWNLOAD / PRINT BILL
  // =========================================================
  const handleDownloadBill = () => {
    window.print();
  };


  // =========================================================
  // STATUS COLORS
  // =========================================================
  const bookingStatusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
    completed: "bg-blue-100 text-blue-700",
  };


  return (
    <div className="p-6 print:p-0">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between mb-6 print:hidden">

        <button
          onClick={() => navigate("/admin/bookings")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft />
          Back to Bookings
        </button>


        <button
          onClick={handleDownloadBill}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-white hover:opacity-90"
        >
          <FaFileDownload />
          Download Bill
        </button>

      </div>


      {/* =====================================================
          BILL CONTAINER
      ====================================================== */}

      <div className="max-w-6xl mx-auto">


        {/* ===================================================
            CUSTOMER DETAILS
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Customer Details
          </h2>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Name */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Name
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.contactName || "-"}
              </p>
            </div>


            {/* Phone */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Phone
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.contactPhone || "-"}
              </p>
            </div>


            {/* Email */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Email
              </p>

              <p className="font-semibold text-gray-800 mt-1 break-all">
                {booking.contactEmail || "-"}
              </p>
            </div>

          </div>

        </div>


        {/* ===================================================
            BOOKING DETAILS
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Booking Details
          </h2>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">


            {/* Booking ID */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Booking ID
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                #{booking._id?.slice(-8).toUpperCase()}
              </p>
            </div>


            {/* Event */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Event
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.eventType || "-"}
              </p>
            </div>


            {/* Event Date */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Event Date
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.eventDate
                  ? new Date(
                      booking.eventDate
                    ).toDateString()
                  : "-"}
              </p>
            </div>


            {/* Package */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Package
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.package?.name || "-"}
              </p>
            </div>


            {/* Guests */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Guests
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.guestCount || 0}
              </p>
            </div>


            {/* Booking Status */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Booking Status
              </p>

              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  bookingStatusColors[
                    booking.status
                  ] ||
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {booking.status || "Unknown"}
              </span>
            </div>


            {/* Created Date */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Booking Created
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.createdAt
                  ? new Date(
                      booking.createdAt
                    ).toLocaleDateString("en-IN")
                  : "-"}
              </p>
            </div>


            {/* Admin Note */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Admin Note
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {booking.adminNote || "-"}
              </p>
            </div>

          </div>


          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="mt-5 bg-gray-50 rounded-xl p-4">

              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Special Requests
              </p>

              <p className="text-sm text-gray-700">
                {booking.specialRequests}
              </p>

            </div>
          )}

        </div>


        {/* ===================================================
            PAYMENT SUMMARY
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Payment Details
          </h2>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


            {/* TOTAL BILL */}
            <div className="bg-gray-50 rounded-xl p-5">

              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Total Bill
              </p>

              <p className="text-2xl font-bold text-gray-800 mt-2">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>

            </div>


            {/* TOTAL PAID */}
            <div className="bg-green-50 rounded-xl p-5">

              <p className="text-xs text-green-600 uppercase tracking-wide">
                Total Paid
              </p>

              <p className="text-2xl font-bold text-green-700 mt-2">
                ₹{totalPaid.toLocaleString("en-IN")}
              </p>

            </div>


            {/* REMAINING */}
            <div
              className={`rounded-xl p-5 ${
                remainingAmount > 0
                  ? "bg-orange-50"
                  : "bg-green-50"
              }`}
            >

              <p
                className={`text-xs uppercase tracking-wide ${
                  remainingAmount > 0
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                Remaining Amount
              </p>

              <p
                className={`text-2xl font-bold mt-2 ${
                  remainingAmount > 0
                    ? "text-orange-700"
                    : "text-green-700"
                }`}
              >
                ₹{remainingAmount.toLocaleString(
                  "en-IN"
                )}
              </p>

            </div>

          </div>


          {/* PAYMENT STATUS */}
          <div className="mt-5">

            <p className="text-sm text-gray-500">
              Payment Status
            </p>

            <span
              className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-semibold ${
                isFullyPaid
                  ? "bg-green-100 text-green-700"
                  : totalPaid > 0
                  ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {displayPaymentStatus}
            </span>

          </div>

        </div>


        {/* ===================================================
            PAYMENT HISTORY
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-xl font-bold text-gray-800">
              Payment History
            </h2>

            <span className="text-sm text-gray-500">
              {successfulPayments.length} Payment
              {successfulPayments.length !== 1
                ? "s"
                : ""}
            </span>

          </div>


          {successfulPayments.length === 0 ? (

            <div className="bg-gray-50 rounded-xl p-6 text-center">

              <p className="text-gray-400 text-sm">
                No successful payment has been made yet.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {successfulPayments.map(
                (payment, index) => (

                  <div
                    key={
                      payment.razorpayPaymentId ||
                      index
                    }
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 rounded-xl p-4"
                  >

                    {/* LEFT */}
                    <div>

                      <p className="font-semibold text-gray-800">
                        Payment {index + 1}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {payment.paidAt
                          ? new Date(
                              payment.paidAt
                            ).toLocaleString(
                              "en-IN"
                            )
                          : "-"}
                      </p>

                      <p className="text-xs text-gray-400 mt-1 break-all">
                        Payment ID:{" "}
                        {payment.razorpayPaymentId ||
                          "-"}
                      </p>

                      <p className="text-xs text-gray-400 mt-1 break-all">
                        Order ID:{" "}
                        {payment.razorpayOrderId ||
                          "-"}
                      </p>

                    </div>


                    {/* RIGHT */}
                    <div className="sm:text-right">

                      <p className="text-lg font-bold text-green-600">
                        ₹
                        {Number(
                          payment.amount || 0
                        ).toLocaleString("en-IN")}
                      </p>

                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Successful
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        {/* ===================================================
            PAYMENT TRANSACTIONS TABLE
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Payment Transactions
          </h2>


          {successfulPayments.length === 0 ? (

            <p className="text-sm text-gray-400">
              No successful transactions yet.
            </p>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b text-left">

                    <th className="py-3 pr-4 text-gray-500">
                      #
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Amount
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Date
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Payment ID
                    </th>

                    <th className="py-3 text-gray-500">
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {successfulPayments.map(
                    (payment, index) => (

                      <tr
                        key={
                          payment.razorpayPaymentId ||
                          index
                        }
                        className="border-b last:border-b-0"
                      >

                        <td className="py-4 pr-4 text-gray-700">
                          {index + 1}
                        </td>


                        <td className="py-4 pr-4 font-semibold text-green-600">
                          ₹
                          {Number(
                            payment.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>


                        <td className="py-4 pr-4 text-gray-600 whitespace-nowrap">
                          {payment.paidAt
                            ? new Date(
                                payment.paidAt
                              ).toLocaleString(
                                "en-IN"
                              )
                            : "-"}
                        </td>


                        <td className="py-4 pr-4 text-xs text-gray-500">
                          {payment.razorpayPaymentId ||
                            "-"}
                        </td>


                        <td className="py-4">

                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            Success
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}