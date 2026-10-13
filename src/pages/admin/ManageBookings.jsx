import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  updateStatus.mutate({
    id: booking._id,
    status: newStatus,
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
  return (
    <div className="p-8">
      {/* ==============================
          HEADER
      ============================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-800">
          Manage Bookings
        </h1>
        {/* FILTER */}
        <div className="flex gap-2 flex-wrap">
          {[
            "",
            "pending",
            "confirmed",
            "rejected",
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
                  return (
                    <tr
  key={booking._id}
  className={
    isZeroDiscount
      ? "bg-amber-50 hover:bg-amber-100 transition-colors"
      : "bg-white hover:bg-gray-50 transition-colors"
  }
>
                      {/* NAME */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {booking.contactName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {booking.contactPhone}
                        </div>
                      </td>
                      {/* EVENT */}
                      <td className="px-4 py-3 text-gray-600">
                        {booking.eventType}
                      </td>
                      {/* DATE */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(
                          booking.eventDate
                        ).toLocaleDateString("en-IN")}
                      </td>
                      {/* PACKAGE */}
                      <td className="px-4 py-3 min-w-[180px]">
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
</td>
                      {/* PAID AMOUNT */}
<td className="px-4 py-3 font-medium text-green-600 whitespace-nowrap">
  ₹{totalPaid.toLocaleString("en-IN")}
</td>
                     {/* REMAINING AMOUNT */}
<td className="px-4 py-3 font-medium text-orange-600 whitespace-nowrap">
  ₹{remainingAmount.toLocaleString("en-IN")}
</td>
                      {/* ==============================
                          STATUS DROPDOWN
                      ============================== */}
                      <td className="px-4 py-3">
                        <select
                          value={booking.status}
                          disabled={updateStatus.isLoading}
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
                        </select>
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
    {/* DELETE */}
    <button
      onClick={() => handleDelete(booking)}
      disabled={deleteBooking.isLoading}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
    >
      {deleteBooking.isLoading ? "Deleting..." : "Delete"}
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
