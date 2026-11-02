import { useState, useEffect } from "react";
import { FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { useNavigate, useLocation} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../../services/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  completed: "bg-blue-100 text-blue-700",
};
export default function ManageBookings() {
  const navigate = useNavigate();
  const location = useLocation();

const selectedBookingId = new URLSearchParams(
  location.search
).get("bookingId");
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  // ==============================
  // GET BOOKINGS
  // ==============================
  const { data, isLoading, isError, refetch } = useQuery(
    ["adminBookings", statusFilter],
    () =>
      api
        .get(
          `/bookings/admin/all${
            statusFilter ? `?status=${statusFilter}` : ""
          }`
        )
        .then((res) => res.data)
  );
  
useEffect(() => {
  const refreshBookings = () => {
    refetch();
  };

  window.addEventListener(
    "booking-discount-updated",
    refreshBookings
  );

  return () => {
    window.removeEventListener(
      "booking-discount-updated",
      refreshBookings
    );
  };
}, [refetch]);

useEffect(() => {
  if (!selectedBookingId || !data?.bookings?.length) return;

  const row = document.getElementById(
    `booking-${selectedBookingId}`
  );

  if (row) {
    row.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, [selectedBookingId, data]);

  // ==============================
  // UPDATE STATUS
  // ==============================
const updateStatus = useMutation(
  ({ id, status }) =>
    api.patch(`/bookings/admin/${id}/status`, { status }),
  {
    onSuccess: () => {
      toast.success("Booking status updated");
      qc.invalidateQueries(["adminBookings", statusFilter]);
      qc.invalidateQueries("bookingStats");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update booking status"
      );
    },
  }
);

const cancelBookingMutation = useMutation(
  ({ id, reason }) =>
    api.patch(`/bookings/admin/${id}/cancel`, { reason }),
  {
    onSuccess: (response) => {
      const emailSent = response.data?.cancellationEmailSent;

      toast.success(
        emailSent
          ? "Booking cancelled. Customer email sent."
          : "Booking cancelled, but customer email was not sent."
      );

      qc.invalidateQueries(["adminBookings"]);
      qc.invalidateQueries("bookingStats");
      qc.invalidateQueries("adminDashboardBookings");
      qc.invalidateQueries(["adminBooking"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to cancel booking."
      );
    },
  }
);

const deleteBooking = useMutation(
  (id) => api.delete(`/bookings/admin/${id}`),
  {
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Booking has been permanently deleted.",
        confirmButtonColor: "#c58b00",
      });
      qc.invalidateQueries(["adminBookings", statusFilter]);
      qc.invalidateQueries("bookingStats");
      qc.invalidateQueries("adminDashboardBookings");
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error.response?.data?.message ||
          "Unable to delete booking.",
        confirmButtonColor: "#d33",
      });
    },
  }
);
  // ==============================
  // STATUS CHANGE
  // ==============================
 
const handleStatusChange = (booking, newStatus) => {
  if (!newStatus || newStatus === booking.status) return;

  if (newStatus === "cancelled") {
    handleCancelBooking(booking);
    return;
  }

  if (["cancelled", "completed"].includes(booking.status)) {
    toast.error("This booking status cannot be changed.");
    return;
  }

  updateStatus.mutate({
    id: booking._id,
    status: newStatus,
  });
};


const handleCancelBooking = async (booking) => {
  if (["cancelled", "completed"].includes(booking.status)) {
    toast.error("This booking cannot be cancelled.");
    return;
  }

  // Match the backend calculation.
  const successfulPaymentTotal = Array.isArray(booking.paymentHistory)
    ? booking.paymentHistory
        .filter((payment) => payment.status === "success")
        .reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        )
    : 0;

  const amountPaid = Math.max(
    successfulPaymentTotal,
    Number(booking.advanceAmount || 0)
  );

  const nonRefundableAmount = Math.min(amountPaid, 11000);
  const amountToSettle = Math.max(
    amountPaid - nonRefundableAmount,
    0
  );

  const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const result = await Swal.fire({
    title: "Cancel this booking?",
    text: `Booking for ${booking.contactName || "this customer"} will be cancelled.`,
    icon: "warning",
    html: `
      <div style="text-align:left;font-size:14px;line-height:1.9">
        <p><b>Booking ID:</b> ${booking.bookingNumber || booking._id}</p>
        <p><b>Amount paid:</b> ${money(amountPaid)}</p>
        <p><b>Non-refundable amount:</b> ${money(nonRefundableAmount)}</p>
        <p><b>Pending office settlement:</b> ${money(amountToSettle)}</p>
        <p style="color:#b45309;font-size:12px">
          Please verify the payment records before confirming.
          This action will cancel the booking.
        </p>
      </div>
    `,
    input: "textarea",
    inputLabel: "Cancellation reason (optional)",
    inputPlaceholder: "Enter reason for cancellation...",
    inputAttributes: {
      "aria-label": "Cancellation reason",
    },
    showCancelButton: true,
    confirmButtonText: "Confirm Cancellation",
    cancelButtonText: "Go Back",
    confirmButtonColor: "#b91c1c",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
    preConfirm: (reason) => String(reason || "").trim(),
  });

  if (!result.isConfirmed) return;

  cancelBookingMutation.mutate({
    id: booking._id,
    reason: result.value || "",
  });
};


const handleDelete = async (booking) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Booking of ${booking.contactName} will be permanently deleted. This action cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete Permanently",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });
  if (!result.isConfirmed) {
    return;
  }
  deleteBooking.mutate(booking._id);
};
const handleExportExcel = async () => {
  try {
    toast.loading("Preparing Excel export...", {
      id: "booking-export",
    });

    // Fetch ALL bookings, without applying the status filter
    const response = await api.get("/bookings/admin/export-all");

    const bookings = response.data?.bookings || [];

    if (!bookings.length) {
      toast.error("No bookings available to export.", {
        id: "booking-export",
      });
      return;
    }

    // SHEET 1: ALL BOOKINGS
    const bookingRows = bookings.map((booking) => {
      const successfulPayments = (
        booking.paymentHistory || []
      ).filter((payment) => payment.status === "success");

      const totalPaid = successfulPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );

      const originalAmount = Number(
        booking.originalAmount ??
        booking.totalAmount ??
        booking.package?.price ??
        0
      );

      const discountAmount = Number(
        booking.discountAmount ?? 0
      );

      const payableAmount = Number(
        booking.payableAmount ??
        booking.totalAmount ??
        Math.max(originalAmount - discountAmount, 0)
      );

      const remainingAmount = Math.max(
        payableAmount - totalPaid,
        0
      );

      return {
        "Booking ID": booking.bookingNumber || booking._id || "",
        "Customer Name": booking.contactName || "",
        "Phone": booking.contactPhone || "",
        "Email": booking.contactEmail || "",
        "Event Type": booking.eventType || "",
        "Event Date": booking.eventDate
          ? new Date(booking.eventDate).toLocaleDateString("en-IN")
          : "",
        "Guest Count": booking.guestCount ?? "",
        "Package": booking.package?.name || "",
        "Original Amount": originalAmount,
        "Discount Amount": discountAmount,
        "Payable Amount": payableAmount,
        "Total Paid": totalPaid,
        "Remaining Amount": remainingAmount,
        "Booking Status": booking.status || "",
        "Created At": booking.createdAt
          ? new Date(booking.createdAt).toLocaleString("en-IN")
          : "",
        "Cancellation Reason":
          booking.cancellationDetails?.reason || "",
        "Amount Paid at Cancellation": Number(
          booking.cancellationDetails?.amountPaidAtCancellation || 0
        ),
        "Non-refundable Amount": Number(
          booking.cancellationDetails?.nonRefundableAmount || 0
        ),
        "Amount to Settle": Number(
          booking.cancellationDetails?.amountToSettle || 0
        ),
        "Settlement Status":
          booking.cancellationDetails?.settlementStatus || "",
      };
    });

    // SHEET 2: COMPLETE PAYMENT HISTORY
    const paymentRows = [];

    bookings.forEach((booking) => {
      (booking.paymentHistory || []).forEach((payment, index) => {
        paymentRows.push({
          "Booking ID": booking.bookingNumber || booking._id || "",
          "Customer Name": booking.contactName || "",
          "Phone": booking.contactPhone || "",
          "Payment Number": index + 1,
          "Amount": Number(payment.amount || 0),
          "Source": payment.source || "",
          "Payment Method": payment.paymentMethod || "",
          "Transaction ID": payment.transactionId || "",
          "Payment Status": payment.status || "",
          "Collected By": payment.collectedBy || "",
          "Payment Date": payment.paidAt
            ? new Date(payment.paidAt).toLocaleString("en-IN")
            : "",
          "Note": payment.note || "",
        });
      });
    });

    // CREATE EXCEL WORKBOOK
    const workbook = XLSX.utils.book_new();

    const bookingsSheet = XLSX.utils.json_to_sheet(bookingRows);
    const paymentsSheet = XLSX.utils.json_to_sheet(paymentRows);

    XLSX.utils.book_append_sheet(
      workbook,
      bookingsSheet,
      "All Bookings"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      paymentsSheet,
      "Payment History"
    );

    // DOWNLOAD EXCEL
    XLSX.writeFile(
      workbook,
      `KD-Utsav-Bookings-${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    toast.success(
      `${bookings.length} bookings exported successfully.`,
      { id: "booking-export" }
    );

  } catch (error) {
    console.error("Booking export error:", error);

    toast.error(
      error.response?.data?.message ||
      "Failed to export bookings.",
      { id: "booking-export" }
    );
  }
};
  return (
    <div className="p-8">
      {/* ==============================
          HEADER
      ============================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
  <h1 className="text-2xl font-serif font-bold text-gray-800">
    Manage Bookings
  </h1>

  <div className="flex flex-wrap items-center gap-2">
    <button
      type="button"
      onClick={handleExportExcel}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
    >
      <FaFileExcel size={16} />
      Export to Excel
    </button>

    {[
      "",
      "pending",
      "confirmed",
      "rejected",
      "cancelled",
      "completed",
    ].map((status) => (
      <button
        key={status}
        onClick={() => setStatusFilter(status)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
          statusFilter === status
            ? "bg-gold text-white"
            : "bg-white text-gray-600 hover:bg-gray-100 border"
        }`}
      >
        {status || "All"}
      </button>
    ))}
  </div>
</div>
      {/* ==============================
          LOADING
      ============================== */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 bg-white rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}
      {/* ==============================
          ERROR
      ============================== */}
      {isError && !isLoading && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-red-500">
            Unable to load bookings.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Please refresh the page and try again.
          </p>
        </div>
      )}
      {/* ==============================
          TABLE
      ============================== */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[
                    "Name",
                    "Event",
                    "Date",
                    "Package",
                    "Paid Amount",
                    "Remaining Amount",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.bookings?.map((booking) => {
  const isConfirmed =
    booking.status === "confirmed";
  // Total successful payments
  const totalPaid = Array.isArray(booking.paymentHistory)
    ? booking.paymentHistory
        .filter((payment) => payment.status === "success")
        .reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        )
    : 0;
  // Remaining amount
const originalAmount = Number(
  booking.originalAmount ??
  booking.totalAmount ??
  booking.package?.price ??
  0
);

const discountAmount = Number(booking.discountAmount ?? 0);

const payableAmount = Number(
  booking.payableAmount ??
  booking.totalAmount ??
  Math.max(originalAmount - discountAmount, 0)
);

const remainingAmount = Math.max(
  payableAmount - totalPaid,
  0
);
const isZeroDiscount = discountAmount === 0;
const cancelledTextClass =
  booking.status === "cancelled"
    ? "line-through decoration-red-500 decoration-2"
    : "";
                  
return (
  <tr
    key={booking._id}
    id={`booking-${booking._id}`}
    
className={[
  "transition-colors",
  booking.status === "cancelled"
    ? "bg-red-50/70 "
    : selectedBookingId === booking._id
      ? "bg-amber-100 ring-2 ring-inset ring-amber-400"
      : isZeroDiscount
        ? "bg-amber-50 hover:bg-amber-100"
        : "bg-white hover:bg-gray-50",
].join(" ")}

  >

                     {/* NAME */}
<td className="px-4 py-3">
  <div className={`font-medium text-gray-800 ${cancelledTextClass}`}>
    {booking.contactName}
  </div>

  <div className={`text-xs text-gray-400 ${cancelledTextClass}`}>
    {booking.contactPhone}
  </div>
</td>
                      {/* EVENT */}
<td className="px-4 py-3 text-gray-600">
  <span className={cancelledTextClass}>
    {booking.eventType}
  </span>
</td>
                     {/* DATE */}
<td className="px-4 py-3 text-gray-600 whitespace-nowrap">
  <span className={cancelledTextClass}>
    {new Date(booking.eventDate).toLocaleDateString("en-IN")}
  </span>
</td>
                      {/* PACKAGE */}
<td className="px-4 py-3 min-w-[180px]">
  <div className={cancelledTextClass}>
    <p className="font-semibold text-gray-800">
      {booking.package?.name || "-"}
    </p>

    <div className="mt-1 space-y-1 text-xs">
      <p className="text-gray-500">
        Original: ₹{originalAmount.toLocaleString("en-IN")}
      </p>

      <p className={discountAmount > 0 ? "text-amber-700" : "text-gray-500"}>
        Discount: −₹{discountAmount.toLocaleString("en-IN")}
      </p>

      <p className="font-semibold text-green-700">
        Payable: ₹{payableAmount.toLocaleString("en-IN")}
      </p>
    </div>
  </div>
</td>
                     {/* PAID AMOUNT */}
<td className="px-4 py-3 font-medium text-green-600 whitespace-nowrap">
  <span className={cancelledTextClass}>
    ₹{totalPaid.toLocaleString("en-IN")}
  </span>
</td>
                    {/* REMAINING AMOUNT */}
<td className="px-4 py-3 font-medium text-orange-600 whitespace-nowrap">
  <span className={cancelledTextClass}>
    ₹{remainingAmount.toLocaleString("en-IN")}
  </span>
</td>
                      {/* ==============================
                          STATUS DROPDOWN
                      ============================== */}
                      <td className="px-4 py-3">
                        <select
  value={booking.status}
  disabled={
    updateStatus.isLoading ||
    cancelBookingMutation.isLoading ||
    ["cancelled", "completed"].includes(booking.status)
  }
                          onChange={(e) =>
                            handleStatusChange(
                              booking,
                              e.target.value
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border-0 outline-none cursor-pointer ${
                            STATUS_COLORS[
                              booking.status
                            ] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <option value="pending">
                            Pending
                          </option>
                          <option value="confirmed">
                            Confirmed
                          </option>
                          <option value="rejected">
                            Rejected
                          </option>
                          <option value="cancelled">
  Cancelled
</option>

<option value="completed" disabled>
  Completed
</option>
                        </select>
                        {booking.status === "cancelled" && booking.cancellationDetails && (
  <div className="mt-2 min-w-[180px] text-xs space-y-1">
    <p>
      <span className="text-gray-500">Paid:</span>{" "}
      ₹{Number(
        booking.cancellationDetails.amountPaidAtCancellation || 0
      ).toLocaleString("en-IN")}
    </p>

    <p className="text-red-600">
      <span>Non-refundable:</span>{" "}
      ₹{Number(
        booking.cancellationDetails.nonRefundableAmount || 0
      ).toLocaleString("en-IN")}
    </p>

    <p className="text-amber-700">
      <span>Office settlement:</span>{" "}
      ₹{Number(
        booking.cancellationDetails.amountToSettle || 0
      ).toLocaleString("en-IN")}
    </p>

    <p className="capitalize text-gray-500">
      Settlement status:{" "}
      {booking.cancellationDetails.settlementStatus || "pending"}
    </p>
  </div>
)}
                      </td>
{/* ==============================
    ACTION BUTTONS
============================== */}
<td className="px-4 py-3">
  <div className="flex items-center gap-2">
    {/* MANAGE */}
    <button
      disabled={!isConfirmed}
      onClick={() => {
        if (!isConfirmed) return;
        navigate(`/admin/bookings/${booking._id}`);
      }}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
        isConfirmed
          ? "text-gold border border-gold hover:bg-gold hover:text-white cursor-pointer"
          : "text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed"
      }`}
    >
      {isConfirmed ? "Manage" : "Confirm First"}
    </button>
   
    {/* DELETE ICON */}
<button
  type="button"
  onClick={() => handleDelete(booking)}
  disabled={deleteBooking.isLoading}
  title="Delete booking"
  aria-label={`Delete booking for ${booking.contactName || "customer"}`}
  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
>
  <FaTrash size={14} />
</button>
  </div>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* EMPTY */}
          {!data?.bookings?.length && (
            <p className="text-center py-12 text-gray-400">
              No bookings found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
