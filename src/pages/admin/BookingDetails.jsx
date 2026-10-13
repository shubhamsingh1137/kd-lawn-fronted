import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import {
  FaArrowLeft,
  FaFileDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaQrcode,
} from "react-icons/fa";
import api from "../../services/api";
import toast from "react-hot-toast";


export default function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [showManualPayment, setShowManualPayment] = useState(false);
  const [discountInput, setDiscountInput] = useState("0");
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

const [manualPayment, setManualPayment] = useState({
  amount: "",
  paymentMethod: "cash",
  paidAt: new Date().toISOString().split("T")[0],
  collectedBy: "",
  transactionId: "",
  note: "",
  receipt:null,
});

const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // =========================================================
  // GET BOOKING DETAILS
  // =========================================================
  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
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

  useEffect(() => {
    if (booking) {
      setDiscountInput(String(booking.discountAmount ?? 0));
    }
  }, [booking?._id, booking?.discountAmount]);



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

  
const originalAmount = Number(
  booking.originalAmount ??
    booking.package?.price ??
    booking.totalAmount ??
    0
);

const discountAmount = Number(
  booking.discountAmount ?? 0
);

const totalAmount = Number(
  booking.payableAmount ??
    booking.totalAmount ??
    Math.max(originalAmount - discountAmount, 0)
);


  // Only successful payments count
  const successfulPayments =
    Array.isArray(booking.paymentHistory)
      ? booking.paymentHistory.filter(
          (payment) => payment.status === "success"
        )
      : [];

  const pendingPayments =
  Array.isArray(booking.paymentHistory)
    ? booking.paymentHistory.filter(
        (payment) => payment.status === "pending"
      )
    : [];

const failedPayments =
  Array.isArray(booking.paymentHistory)
    ? booking.paymentHistory.filter(
        (payment) => payment.status === "failed"
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

const handleSaveDiscount = async (e) => {
  e.preventDefault();

  if (booking.status !== "confirmed") {
    toast.error("Please confirm the booking first.");
    return;
  }

  const discount = Number(discountInput);

  if (!Number.isFinite(discount) || discount < 0) {
    toast.error("Please enter a valid discount amount.");
    return;
  }

  if (discount > originalAmount) {
    toast.error("Discount cannot exceed the original amount.");
    return;
  }

  const payable = originalAmount - discount;

  if (payable < totalPaid) {
    toast.error(
      "Discount cannot make the payable amount less than the amount already paid."
    );
    return;
  }

  try {
    setIsSavingDiscount(true);

    await api.patch(
      `/bookings/admin/${bookingId}/discount`,
      {
        discountAmount: discount,
      }
    );

   
toast.success("Discount saved successfully.");

window.dispatchEvent(
  new Event("booking-discount-updated")
);

await refetch();

  } catch (error) {
    console.error("Save discount error:", error);

    toast.error(
      error?.response?.data?.message ||
        "Failed to save discount."
    );
  } finally {
    setIsSavingDiscount(false);
  }
};



  // =========================================================
  // DOWNLOAD / PRINT BILL
  // =========================================================
  const handleDownloadBill = () => {
    window.print();
  };
  
// PREVIEW / DOWNLOAD BACKEND-GENERATED INVOICE PDF
const handlePreviewInvoice = async () => {
  // Click ke time hi new tab open karo, taki popup blocker issue na ho
  const invoiceWindow = window.open("", "_blank");

  if (!invoiceWindow) {
    toast.error("Please allow pop-ups to preview the invoice.");
    return;
  }

  invoiceWindow.document.write(
    "<p style='font-family:Arial;padding:20px'>Generating invoice PDF...</p>"
  );

  try {
    const response = await api.get(
      `/bookings/admin/${bookingId}/invoice`,
      {
        responseType: "blob",
      }
    );

    const pdfBlob = new Blob([response.data], {
      type: "application/pdf",
    });

    const pdfUrl = URL.createObjectURL(pdfBlob);

    invoiceWindow.location.href = pdfUrl;
  } catch (error) {
    console.error("Invoice preview error:", error);

    invoiceWindow.close();

    toast.error(
      error?.response?.data?.message ||
        "Failed to load invoice PDF."
    );
  }
};

// =========================================================
// APPROVE QR PAYMENT
// =========================================================

const handleApproveQRPayment = async (paymentId) => {
  try {
    const confirmed = window.confirm(
      "Are you sure you want to approve this QR payment?"
    );

    if (!confirmed) return;

   await api.patch(
  `/bookings/admin/${bookingId}/qr-payment/${paymentId}/approve`
);

    toast.success("QR payment approved successfully.");

    await refetch();
  } catch (error) {
    console.error("Approve QR payment error:", error);

    toast.error(
      error?.response?.data?.message ||
        "Failed to approve QR payment."
    );
  }
};

// =========================================================
// REJECT QR PAYMENT
// =========================================================

const handleRejectQRPayment = async (paymentId) => {
  try {
    const confirmed = window.confirm(
      "Are you sure you want to reject this QR payment?"
    );

    if (!confirmed) return;

    await api.patch(
  `/bookings/admin/${bookingId}/qr-payment/${paymentId}/reject`
);

    toast.success("QR payment rejected.");

    await refetch();
  } catch (error) {
    console.error("Reject QR payment error:", error);

    toast.error(
      error?.response?.data?.message ||
        "Failed to reject QR payment."
    );
  }
};


  const handleManualPayment = async (e) => {
  e.preventDefault();

  const amount = Number(manualPayment.amount);

  if (!amount || amount <= 0) {
    alert("Please enter a valid payment amount.");
    return;
  }

  if (amount > remainingAmount) {
    alert(
      `Payment amount cannot be greater than remaining amount ₹${remainingAmount.toLocaleString(
        "en-IN"
      )}.`
    );
    return;
  }

  if (!manualPayment.collectedBy.trim()) {
    alert("Please enter collected by name.");
    return;
  }

  try {
    setIsSubmittingPayment(true);

    // =========================================
    // CREATE FORM DATA
    // =========================================

    const formData = new FormData();

    formData.append("amount", String(amount));

    formData.append(
      "paymentMethod",
      manualPayment.paymentMethod
    );

    formData.append(
      "paidAt",
      manualPayment.paidAt
    );

    formData.append(
      "collectedBy",
      manualPayment.collectedBy.trim()
    );

    formData.append(
      "transactionId",
      manualPayment.transactionId.trim()
    );

    formData.append(
      "note",
      manualPayment.note.trim()
    );

    // =========================================
    // IMPORTANT: RECEIPT FILE
    // =========================================

    if (manualPayment.receipt) {
      formData.append(
        "receipt",
        manualPayment.receipt
      );
    }

    // DEBUG
    console.log(
      "Selected receipt:",
      manualPayment.receipt
    );

    console.log(
      "Receipt name:",
      manualPayment.receipt?.name
    );

    console.log(
      "Receipt type:",
      manualPayment.receipt?.type
    );

    // =========================================
    // API REQUEST
    // =========================================

    await api.post(
      `/bookings/admin/${bookingId}/manual-payment`,
      formData
    );

    toast.success("Manual payment added successfully.");

    setShowManualPayment(false);

    setManualPayment({
      amount: "",
      paymentMethod: "cash",
      paidAt: new Date()
        .toISOString()
        .split("T")[0],
      collectedBy: "",
      transactionId: "",
      note: "",
      receipt: null,
    });

    await refetch();

  } catch (error) {
    console.error(
      "Manual payment error:",
      error
    );

    alert(
      error?.response?.data?.message ||
      "Failed to add manual payment."
    );

  } finally {
    setIsSubmittingPayment(false);
  }
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
  type="button"
  onClick={handlePreviewInvoice}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-white hover:opacity-90"
>
  <FaFileDownload />
  Preview Invoice
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

{booking.status === "confirmed" && (
  <form
    onSubmit={handleSaveDiscount}
    className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5"
  >
    <h3 className="text-base font-semibold text-gray-800">
      Manage Booking Discount
    </h3>

    <p className="mt-1 text-sm text-gray-600">
      Original amount: ₹
      {originalAmount.toLocaleString("en-IN")}
    </p>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label
          htmlFor="booking-discount"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Discount Amount (₹)
        </label>

        <input
          id="booking-discount"
          type="number"
          min="0"
          max={originalAmount}
          step="0.01"
          value={discountInput}
          onChange={(e) => setDiscountInput(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-amber-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSavingDiscount}
        className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSavingDiscount ? "Saving..." : "Save Discount"}
      </button>
    </div>

    <div className="mt-4 border-t border-amber-200 pt-3 text-sm">
      <p>
        Discount: ₹
        {Math.max(
          Number.isFinite(Number(discountInput))
            ? Number(discountInput)
            : 0,
          0
        ).toLocaleString("en-IN")}
      </p>

      <p className="mt-1 font-semibold text-green-700">
        New Payable: ₹
        {Math.max(
          originalAmount -
            Math.max(
              Number.isFinite(Number(discountInput))
                ? Number(discountInput)
                : 0,
              0
            ),
          0
        ).toLocaleString("en-IN")}
      </p>
    </div>
  </form>
)}



          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            
{/* ORIGINAL AMOUNT */}
<div className="bg-gray-50 rounded-xl p-5">
  <p className="text-xs text-gray-500 uppercase tracking-wide">
    Original Amount
  </p>
  <p className="text-2xl font-bold text-gray-800 mt-2">
    ₹{originalAmount.toLocaleString("en-IN")}
  </p>
</div>

{/* DISCOUNT */}
<div className="bg-amber-50 rounded-xl p-5">
  <p className="text-xs text-amber-700 uppercase tracking-wide">
    Discount
  </p>
  <p className="text-2xl font-bold text-amber-700 mt-2">
    −₹{discountAmount.toLocaleString("en-IN")}
  </p>
</div>



            {/* TOTAL BILL */}
            <div className="bg-gray-50 rounded-xl p-5">

              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Final Payable Amount
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
   
          {remainingAmount > 0 && (
  <button
    type="button"
    onClick={() => setShowManualPayment(true)}
    className="mt-5 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 print:hidden"
  >
    + Add Manual Payment
  </button>
)}

{/* ===================================================
    PENDING QR PAYMENTS
==================================================== */}

{pendingPayments.length > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm p-6 mb-6">

    <div className="flex items-center justify-between mb-5">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-full bg-white border border-yellow-200 flex items-center justify-center">
          <FaQrcode className="text-yellow-600 text-lg" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Pending QR Payments
          </h2>

          <p className="text-sm text-yellow-700 mt-1">
            These payments are waiting for admin verification.
          </p>
        </div>

      </div>

      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
        {pendingPayments.length} Pending
      </span>

    </div>

    <div className="space-y-4">

      {pendingPayments.map((payment, index) => (

        <div
          key={payment._id || `pending-${index}`}
          className="bg-white rounded-xl border border-yellow-200 p-5"
        >

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

            {/* PAYMENT INFO */}

            <div className="flex-1">

              <div className="flex items-center gap-2 flex-wrap">

                <h3 className="font-bold text-gray-800">
                  QR Payment
                </h3>

                <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                  Pending Verification
                </span>

              </div>

              <p className="text-2xl font-bold text-gray-800 mt-3">
                ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

                {/* Transaction ID */}

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Transaction / UTR ID
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-1 break-all">
                    {payment.transactionId || "-"}
                  </p>
                </div>

                {/* Payment Date */}

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Payment Date
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleString("en-IN")
                      : "-"}
                  </p>
                </div>

                {/* Payment Mode */}

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Payment Mode
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-1 capitalize">
                    {(payment.paymentMethod || "upi")
                      .replaceAll("_", " ")}
                  </p>
                </div>

                {/* Source */}

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Source
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    QR Payment
                  </p>
                </div>

              </div>

              {/* NOTE */}

              {payment.note && (
                <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">

                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Note
                  </p>

                  <p className="text-sm text-gray-700 mt-1 break-words">
                    {payment.note}
                  </p>

                </div>
              )}

              {/* RECEIPT */}

              {payment.receiptAttachment && (
                <div className="mt-4">

                  <a
                    href={payment.receiptAttachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
                  >
                    View Payment Receipt
                  </a>

                </div>
              )}

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32">

              <button
                type="button"
                onClick={() =>
                  handleApproveQRPayment(payment._id)
                }
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                <FaCheckCircle />
                Approve
              </button>

              <button
                type="button"
                onClick={() =>
                  handleRejectQRPayment(payment._id)
                }
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                <FaTimesCircle />
                Reject
              </button>

            </div>

          </div>

        </div>

      ))}

    </div>

  </div>
)}

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
              {successfulPayments.length} Successful Payment
              {successfulPayments.length !== 1 ? "s" : ""}
              
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
                      payment.transactionId ||
                      `${payment.paidAt || "payment"}-${index}`
                    }
                    className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800">
                            Payment {index + 1}
                          </p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            payment.source === "manual"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {payment.source === "manual" ? "Manual Payment" : "Razorpay"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleString("en-IN")
                            : "-"}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xl font-bold text-green-600">
                          ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                        </p>
                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {payment.status === "success" ? "Successful" : "Failed"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Payment Mode</p>
                        <p className="text-sm font-medium text-gray-800 mt-1 capitalize">
                          {(payment.paymentMethod || (payment.source === "razorpay" ? "razorpay" : "-"))
                            .replaceAll("_", " ")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Received / Collected By</p>
                        <p className="text-sm font-medium text-gray-800 mt-1 break-words">
                          {payment.collectedBy || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Transaction / Reference ID</p>
                        <p className="text-sm font-medium text-gray-800 mt-1 break-all">
                          {payment.transactionId || payment.razorpayPaymentId || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Payment Date & Time</p>
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleString("en-IN")
                            : "-"}
                        </p>
                      </div>

                      {payment.razorpayPaymentId && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Razorpay Payment ID</p>
                          <p className="text-sm font-medium text-gray-800 mt-1 break-all">
                            {payment.razorpayPaymentId}
                          </p>
                        </div>
                      )}

                      {payment.razorpayOrderId && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Razorpay Order ID</p>
                          <p className="text-sm font-medium text-gray-800 mt-1 break-all">
                            {payment.razorpayOrderId}
                          </p>
                        </div>
                      )}
                    </div>

                    {payment.note && (
                      <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Note</p>
                        <p className="text-sm text-gray-700 mt-1 break-words">{payment.note}</p>
                      </div>
                    )}

                    {payment.receiptAttachment && (
                      <div className="mt-4">
                        <a
                          href={payment.receiptAttachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100"
                        >
                          View Payment Receipt
                        </a>
                      </div>
                    )}
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

              <table className="w-full min-w-[1000px] text-sm">

                <thead>
                  <tr className="border-b text-left">

                    <th className="py-3 pr-4 text-gray-500">
                      #
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Amount
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Payment Mode
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Received By
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Date
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Transaction / Payment ID
                    </th>

                    <th className="py-3 pr-4 text-gray-500">
                      Source
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
                          payment.transactionId ||
                          `${payment.paidAt || "payment"}-${index}`
                        }
                        className="border-b last:border-b-0"
                      >
                        <td className="py-4 pr-4 text-gray-700">
                          {index + 1}
                        </td>

                        <td className="py-4 pr-4 font-semibold text-green-600 whitespace-nowrap">
                          ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="py-4 pr-4 text-gray-700 capitalize whitespace-nowrap">
                          {(payment.paymentMethod || (payment.source === "razorpay" ? "razorpay" : "-"))
                            .replaceAll("_", " ")}
                        </td>

                        <td className="py-4 pr-4 text-gray-700 whitespace-nowrap">
                          {payment.collectedBy || "-"}
                        </td>

                        <td className="py-4 pr-4 text-gray-600 whitespace-nowrap">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleString("en-IN")
                            : "-"}
                        </td>

                        <td className="py-4 pr-4 text-xs text-gray-500 break-all min-w-[180px]">
                          {payment.transactionId || payment.razorpayPaymentId || "-"}
                        </td>

                        <td className="py-4 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            payment.source === "manual"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {payment.source === "manual" ? "Manual" : "Razorpay"}
                          </span>
                        </td>

                        <td className="py-4">
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap">
                            {payment.status === "success" ? "Success" : "Failed"}
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


        {/* ===================================================
            MANUAL PAYMENT MODAL
        ==================================================== */}

        {showManualPayment && (
          <div
            className="
              fixed inset-0 z-[9999]
              bg-black/50
              p-3 sm:p-4
              overflow-y-auto
              print:hidden
            "
          >

            {/* Modal Center Wrapper */}
            <div
              className="
                min-h-full
                flex
                items-center
                justify-center
              "
            >

              {/* Modal */}
              <div
                className="
                  w-full
                  max-w-lg
                  sm:max-w-xl
                  bg-white
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                  my-3
                  sm:my-6
                  max-h-[94vh]
                  flex
                  flex-col
                "
              >

                {/* =================================================
                    MODAL HEADER
                ================================================== */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    px-5
                    sm:px-6
                    py-4
                    border-b
                    border-gray-200
                    bg-white
                    flex-shrink-0
                  "
                >

                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                      Add Manual Payment
                    </h2>

                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Record a payment collected manually.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowManualPayment(false)
                    }
                    className="
                      flex-shrink-0
                      ml-3
                      w-9
                      h-9
                      flex
                      items-center
                      justify-center
                      rounded-full
                      text-gray-500
                      hover:bg-gray-100
                      hover:text-gray-800
                      text-2xl
                      leading-none
                    "
                  >
                    ×
                  </button>

                </div>


                {/* =================================================
                    MODAL BODY
                ================================================== */}

                <div
                  className="
                    overflow-y-auto
                    flex-1
                    px-5
                    sm:px-6
                    py-5
                  "
                >

                  <form
                    id="manual-payment-form"
                    onSubmit={handleManualPayment}
                    className="space-y-4"
                  >

                    {/* Amount */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Amount *
                      </label>

                      <input
                        type="number"
                        min="1"
                        max={remainingAmount}
                        value={manualPayment.amount}
                        onChange={(e) =>
                          setManualPayment({
                            ...manualPayment,
                            amount: e.target.value,
                          })
                        }
                        placeholder={`Max ₹${remainingAmount.toLocaleString(
                          "en-IN"
                        )}`}
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-sm
                          outline-none
                          focus:border-green-500
                          focus:ring-2
                          focus:ring-green-100
                        "
                        required
                      />

                      <p className="text-xs text-gray-400 mt-1">
                        Remaining amount: ₹
                        {remainingAmount.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                    </div>


                    {/* Payment Method */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Payment Method *
                      </label>

                      <select
                        value={manualPayment.paymentMethod}
                        onChange={(e) =>
                          setManualPayment({
                            ...manualPayment,
                            paymentMethod: e.target.value,
                          })
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-sm
                          bg-white
                          outline-none
                          focus:border-green-500
                          focus:ring-2
                          focus:ring-green-100
                        "
                      >

                        <option value="cash">
                          Cash
                        </option>

                        <option value="upi">
                          UPI
                        </option>

                        <option value="bank_transfer">
                          Bank Transfer
                        </option>

                        <option value="card">
                          Card
                        </option>

                        <option value="other">
                          Other
                        </option>

                      </select>

                    </div>


                    {/* Payment Date */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Payment Date *
                      </label>

                      <input
                        type="date"
                        value={manualPayment.paidAt}
                        onChange={(e) =>
                          setManualPayment({
                            ...manualPayment,
                            paidAt: e.target.value,
                          })
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-sm
                          outline-none
                          focus:border-green-500
                          focus:ring-2
                          focus:ring-green-100
                        "
                        required
                      />

                    </div>


                    {/* Collected By */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Collected By *
                      </label>

                      <input
                        type="text"
                        value={manualPayment.collectedBy}
                        onChange={(e) =>
                          setManualPayment({
                            ...manualPayment,
                            collectedBy: e.target.value,
                          })
                        }
                        placeholder="Enter collector name"
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-sm
                          outline-none
                          focus:border-green-500
                          focus:ring-2
                          focus:ring-green-100
                        "
                        required
                      />

                    </div>


                    {/* Transaction ID */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Transaction / Reference ID
                      </label>

                      <input
                        type="text"
                        value={manualPayment.transactionId}
                        onChange={(e) =>
                          setManualPayment({
                            ...manualPayment,
                            transactionId: e.target.value,
                          })
                        }
                        placeholder="Optional"
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-sm
                          outline-none
                          focus:border-green-500
                          focus:ring-2
                          focus:ring-green-100
                        "
                      />

                    </div>


                    {/* Note */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Note
                      </label>

                      <textarea
                        rows="3"
                        value={manualPayment.note}
                        onChange={(e) =>
                          setManualPayment({
                            ...manualPayment,
                            note: e.target.value,
                          })
                        }
                        placeholder="Optional"
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-sm
                          resize-none
                          outline-none
                          focus:border-green-500
                          focus:ring-2
                          focus:ring-green-100
                        "
                      />

                    </div>


                    {/* Receipt Attachment */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Payment Receipt / Proof
                      </label>

                      <div
                        className="
                          border
                          border-dashed
                          border-gray-300
                          rounded-xl
                          p-4
                          bg-gray-50
                        "
                      >

                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            setManualPayment({
                              ...manualPayment,
                              receipt:
                                e.target.files?.[0] ||
                                null,
                            })
                          }
                          className="
                            block
                            w-full
                            text-sm
                            text-gray-600
                            file:mr-3
                            file:py-2
                            file:px-4
                            file:rounded-lg
                            file:border-0
                            file:text-sm
                            file:font-medium
                            file:bg-green-50
                            file:text-green-700
                            hover:file:bg-green-100
                          "
                        />

                        <p className="text-xs text-gray-400 mt-2">
                          Upload receipt image or PDF.
                        </p>

                      </div>

                    </div>

                  </form>

                </div>


                {/* =================================================
                    MODAL FOOTER
                ================================================== */}

                <div
                  className="
                    flex
                    flex-col-reverse
                    sm:flex-row
                    sm:justify-end
                    gap-2
                    sm:gap-3
                    px-5
                    sm:px-6
                    py-4
                    border-t
                    border-gray-200
                    bg-white
                    flex-shrink-0
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      setShowManualPayment(false)
                    }
                    className="
                      w-full
                      sm:w-auto
                      px-5
                      py-2.5
                      rounded-xl
                      border
                      border-gray-300
                      text-gray-700
                      text-sm
                      font-medium
                      hover:bg-gray-50
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="manual-payment-form"
                    disabled={isSubmittingPayment}
                    className="
                      w-full
                      sm:w-auto
                      px-5
                      py-2.5
                      rounded-xl
                      bg-green-600
                      text-white
                      text-sm
                      font-medium
                      hover:bg-green-700
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >
                    {isSubmittingPayment
                      ? "Saving..."
                      : "Save Payment"}
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}