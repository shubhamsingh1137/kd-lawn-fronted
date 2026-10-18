import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import {

  FaCalendarAlt,

  FaUser,

  FaPhone,

  FaEnvelope,

  FaUsers,

  FaBoxOpen,

  FaMoneyBillWave,

  FaCheckCircle,

  FaArrowLeft,

} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Swal from "sweetalert2";

const EVENT_TYPES = [

  "Wedding",

  "Reception",

  "Engagement",

  "Birthday",

  "Corporate",

  "Other",

];

const initialForm = {

  contactName: "",

  contactPhone: "",

  contactEmail: "",
  contactAddress: "",

  eventType: "Wedding",

  eventDate: "",

  packageId: "",

  guestCount: "100",

  totalAmount: "",
  discountAmount: "0",

  advanceAmount: "0",

  specialRequests: "",

  adminNote: "",

};

const money = (amount) =>

  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const getPackagePrice = (pkg) => {

  const possiblePrices = [

    pkg?.price,

    pkg?.packagePrice,

    pkg?.amount,

    pkg?.basePrice,

    pkg?.totalAmount,

  ];

  const price = possiblePrices.find(

    (value) =>

      value !== undefined &&

      value !== null &&

      value !== "" &&

      Number.isFinite(Number(value))

  );

  return price === undefined ? null : Number(price);

};

export default function WalkInBooking() {

  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);

const [bookedDates, setBookedDates] = useState([]);
const [loadingBookedDates, setLoadingBookedDates] = useState(true);


  const [form, setForm] = useState(initialForm);

  const [loadingPackages, setLoadingPackages] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const today = new Date();

  const minDate = [

    today.getFullYear(),

    String(today.getMonth() + 1).padStart(2, "0"),

    String(today.getDate()).padStart(2, "0"),

  ].join("-");

  useEffect(() => {

    const fetchPackages = async () => {

      try {

        setLoadingPackages(true);

        setError("");

        // Uses the existing public packages API.

        const response = await api.get("/packages");

        const data = response.data;

        const packageList = Array.isArray(data)

          ? data

          : data?.packages ||

            data?.data?.packages ||

            data?.data ||

            [];

        setPackages(

          Array.isArray(packageList) ? packageList : []

        );

      } catch (err) {

        console.error("Fetch packages error:", err);

        setError(

          "Packages could not be loaded. Please check the packages API."

        );

      } finally {

        setLoadingPackages(false);

      }

    };

    fetchPackages();

  }, []);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        setLoadingBookedDates(true);

        const response = await api.get("/bookings/booked-dates");
        setBookedDates(response.data?.dates || []);
      } catch (err) {
        console.error("Fetch booked dates error:", err);
        setError(
          "Unable to load booking availability. Please refresh and try again."
        );
      } finally {
        setLoadingBookedDates(false);
      }
    };

    fetchBookedDates();
  }, []);


  const selectedPackage = useMemo(

    () =>

      packages.find(

        (pkg) => pkg._id === form.packageId

      ),

    [packages, form.packageId]

  );

  const packagePrice = getPackagePrice(selectedPackage);

const totalAmount = Number(form.totalAmount || 0);
const discountAmount = Number(form.discountAmount || 0);
const payableAmount = totalAmount - discountAmount;
const advanceAmount = Number(form.advanceAmount || 0);
const remainingAmount = payableAmount - advanceAmount;

  const paymentStatus =

    advanceAmount <= 0

      ? "unpaid"

      : remainingAmount <= 0

        ? "fully_paid"

        : "advance_paid";

  const updateField = (event) => {

    const { name, value } = event.target;

    setForm((prev) => {

      const updated = {

        ...prev,

        [name]: value,

      };

      // Fill the package price when the package changes.

      if (name === "packageId") {

        const chosenPackage = packages.find(

          (pkg) => pkg._id === value

        );

        const price = getPackagePrice(chosenPackage);

        if (price !== null) {

          updated.totalAmount = String(price);

        }

      }

      return updated;

    });

    setError("");

    setSuccess("");

  };

  const validateForm = () => {

    if (!form.contactName.trim()) {

      return "Please enter the customer's name.";

    }

    if (!/^[6-9]\d{9}$/.test(form.contactPhone.trim())) {

      return "Please enter a valid 10-digit Indian mobile number.";

    }

    if (

      !form.contactEmail.trim() ||

      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(

        form.contactEmail.trim()

      )

    ) {

      return "Please enter a valid customer email address.";

    }

    if (!form.eventDate || form.eventDate < minDate) {

      return "Please select today or a future event date.";

    }

    if (!form.packageId) {

      return "Please select a package.";

    }

    if (!form.guestCount || Number(form.guestCount) < 1) {

      return "Guest count must be at least 1.";

    }

    if (

      form.totalAmount === "" ||

      !Number.isFinite(totalAmount) ||

      totalAmount < 0

    ) {

      return "Please enter a valid total amount.";

    }

if (
  form.discountAmount === "" ||
  !Number.isFinite(discountAmount) ||
  discountAmount < 0 ||
  discountAmount > totalAmount
) {
  return "Discount must be between ₹0 and the total amount.";
}


    if (

      form.advanceAmount === "" ||

      !Number.isFinite(advanceAmount) ||

      advanceAmount < 0

    ) {

      return "Please enter a valid advance amount.";

    }

    if (advanceAmount > payableAmount) {
  return "Advance amount cannot exceed the payable amount after discount.";
}

    return "";

  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    setSuccess("");

    const validationError = validateForm();

    if (validationError) {

      setError(validationError);

      return;

    }

if (loadingBookedDates) {
  setError("Please wait while booking availability loads.");
  return;
}

if (bookedDates.includes(form.eventDate)) {
  setError(
    "This date is already booked. Please try another date."
  );
  return;
}


   const confirmation = await Swal.fire({
  title: "Confirm Walk-in Booking?",
  text: "Do you want to create this booking with Confirmed status?",
  icon: "question",
  showCancelButton: true,
  confirmButtonText: "Yes, Create Booking",
  cancelButtonText: "Cancel",
  confirmButtonColor: "#b8860b",
  cancelButtonColor: "#6b7280",
  reverseButtons: true,
});

if (!confirmation.isConfirmed) return;

    try {

      setSubmitting(true);

      const payload = {

        contactName: form.contactName.trim(),

        contactPhone: form.contactPhone.trim(),

        contactEmail: form.contactEmail.trim(),

        contactAddress: form.contactAddress.trim(),

        eventType: form.eventType,

        eventDate: form.eventDate,

        package: form.packageId,

        guestCount: Number(form.guestCount),

        totalAmount: totalAmount,
originalAmount: totalAmount,
discountAmount,
payableAmount,
advanceAmount,
remainingAmount,

        paymentStatus,

        specialRequests: form.specialRequests.trim(),

        adminNote: form.adminNote.trim(),

        bookingSource: "walk_in",

      };

      // Requires the matching admin-only backend endpoint.

      const response = await api.post(

        "/bookings/admin/walk-in",

        payload

      );

      if (response.data?.success === false) {

        throw new Error(

          response.data?.message || "Booking could not be created."

        );

      }

      await Swal.fire({
  title: "Booking Created!",
  text:
    response.data?.message ||
    "Walk-in booking has been created successfully.",
  icon: "success",
  confirmButtonText: "OK",
  confirmButtonColor: "#15803d",
});

      setForm(initialForm);

      // Redirect to booking details if the API returns a booking ID.

      const booking =

        response.data?.booking ||

        response.data?.data?.booking;

      const bookingId = booking?._id || booking?.id;

      if (bookingId) {

        window.setTimeout(() => {

          navigate(`/admin/bookings/${bookingId}`);

        }, 1200);

      }

    } catch (err) {

      console.error(

        "Create walk-in booking error:",

        err.response?.data || err

      );

     const errorMessage =
  err.response?.data?.message ||
  err.message ||
  "Unable to create the booking. Please try again.";

setError("");

await Swal.fire({
  title: "Booking Failed",
  text: errorMessage,
  icon: "error",
  confirmButtonText: "OK",
  confirmButtonColor: "#dc2626",
});

    } finally {

      setSubmitting(false);

    }

  };

  const inputClass =

    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100";

  const labelClass =

    "flex items-center gap-2 text-sm font-medium text-gray-700";

  return (

    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* Page heading */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <button

              type="button"

              onClick={() => navigate("/admin/bookings")}

              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-amber-700"

            >

              <FaArrowLeft />

              Back to Bookings

            </button>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">

              Walk-in Booking

            </h1>

            </div>

         

        </div>

        {/* Alerts */}

         <form onSubmit={handleSubmit} className="space-y-6">

          {/* Customer information */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 border-b border-gray-100 pb-4">

              <h2 className="text-lg font-semibold text-gray-900">

                Customer Details

              </h2>

              <p className="mt-1 text-sm text-gray-500">

                Enter the customer's correct contact information.

              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>

                <label className={labelClass}>

                  <FaUser className="text-amber-700" />

                  Customer Name \*

                </label>

                <input

                  name="contactName"

                  value={form.contactName}

                  onChange={updateField}

                  className={inputClass}

                  placeholder="Enter full name"

                  autoComplete="name"

                  maxLength={100}

                  required

                />

              </div>

              <div>

                <label className={labelClass}>

                  <FaPhone className="text-amber-700" />

                  Mobile Number \*

                </label>

                <input

                  name="contactPhone"

                  type="tel"

                  value={form.contactPhone}

                  onChange={updateField}

                  className={inputClass}

                  placeholder="10-digit mobile number"

                  autoComplete="tel"

                  inputMode="numeric"

                  maxLength={10}

                  required

                />

              </div>

              <div className="md:col-span-2">

                <label className={labelClass}>

                  <FaEnvelope className="text-amber-700" />

                  Email Address \*

                </label>

                <input

                  name="contactEmail"

                  type="email"

                  value={form.contactEmail}

                  onChange={updateField}

                  className={inputClass}

                  placeholder="customer@example.com"

                  autoComplete="email"

                  maxLength={150}

                  required

                />

                <p className="mt-1.5 text-xs text-gray-500">

                  The backend must send the booking notification to this address.

                </p>

<div className="md:col-span-2">
  <label className={labelClass}>
    Client Address
  </label>
  <textarea
    name="contactAddress"
    value={form.contactAddress}
    onChange={updateField}
    className={inputClass}
    placeholder="Enter complete client address"
    rows={3}
    maxLength={500}
  />
</div>


              </div>

            </div>

          </section>

          {/* Event information */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 border-b border-gray-100 pb-4">

              <h2 className="text-lg font-semibold text-gray-900">

                Event Details

              </h2>

              <p className="mt-1 text-sm text-gray-500">

                Choose the event, date and package.

              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>

                <label className={labelClass}>

                  Event Type \*

                </label>

                <select

                  name="eventType"

                  value={form.eventType}

                  onChange={updateField}

                  className={inputClass}

                  required

                >

                  {EVENT_TYPES.map((type) => (

                    <option key={type} value={type}>

                      {type}

                    </option>

                  ))}

                </select>

              </div>

              <div>

                <label className={labelClass}>

                  <FaCalendarAlt className="text-amber-700" />

                  Event Date \*

                </label>

               
<div className="mt-2 rounded-xl border border-gray-200 p-3 sm:p-4">
  {loadingBookedDates ? (
    <p className="text-sm text-gray-500">
      Loading date availability...
    </p>
  ) : (
    <>
      <DayPicker
        mode="single"
        selected={
          form.eventDate
            ? new Date(`${form.eventDate}T12:00:00`)
            : undefined
        }
        onSelect={(date) => {
          if (!date) return;

          const isoDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
          ].join("-");

          if (bookedDates.includes(isoDate)) {
            setError(
              "This date is already booked. Please try another date."
            );
            return;
          }

          setForm((prev) => ({
            ...prev,
            eventDate: isoDate,
          }));
          setError("");
          setSuccess("");
        }}
        disabled={[
          { before: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              new Date().getDate()
            ) },
          (date) => {
            const isoDate = [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, "0"),
              String(date.getDate()).padStart(2, "0"),
            ].join("-");

            return bookedDates.includes(isoDate);
          },
        ]}
        modifiers={{
          booked: (date) => {
            const isoDate = [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, "0"),
              String(date.getDate()).padStart(2, "0"),
            ].join("-");

            return bookedDates.includes(isoDate);
          },
          available: (date) => {
            const isoDate = [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, "0"),
              String(date.getDate()).padStart(2, "0"),
            ].join("-");

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return date >= today && !bookedDates.includes(isoDate);
          },
        }}
        modifiersClassNames={{
          booked: "walkin-booked-date",
          available: "walkin-available-date",
        }}
        className="mx-auto"
      />

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-green-600" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-red-600" />
          Already booked
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-700">
        Selected date:{" "}
        <strong>{form.eventDate || "No date selected"}</strong>
      </p>
    </>
  )}
</div>

<style>{`
  .walkin-booked-date {
    color: white !important;
    background-color: #dc2626 !important;
    border-radius: 6px !important;
    opacity: 1 !important;
  }

  .walkin-available-date {
    color: #15803d !important;
  }
`}</style>

              </div>

              <div>

                <label className={labelClass}>

                  <FaBoxOpen className="text-amber-700" />

                  Select Package \*

                </label>

                <select

                  name="packageId"

                  value={form.packageId}

                  onChange={updateField}

                  className={inputClass}

                  disabled={loadingPackages}

                  required

                >

                  <option value="">

                    {loadingPackages

                      ? "Loading packages..."

                      : "Select a package"}

                  </option>

                  {packages.map((pkg) => (

                    <option key={pkg._id} value={pkg._id}>

                      {pkg.name || pkg.packageName || "Package"}

                      {getPackagePrice(pkg) !== null

                        ? ` — ${money(getPackagePrice(pkg))}`

                        : ""}

                    </option>

                  ))}

                </select>

                {!loadingPackages && packages.length === 0 && (

                  <p className="mt-1.5 text-xs text-red-600">

                    No packages were returned by the packages API.

                  </p>

                )}

              </div>

              <div>

                <label className={labelClass}>

                  <FaUsers className="text-amber-700" />

                  Guest Count \*

                </label>

                <input

                  name="guestCount"

                  type="number"

                  min="1"

                  step="1"

                  value={form.guestCount}

                  onChange={updateField}

                  className={inputClass}

                  required

                />

              </div>

              <div className="md:col-span-2">

                <label className={labelClass}>

                  Special Requests

                </label>

                <textarea

                  name="specialRequests"

                  value={form.specialRequests}

                  onChange={updateField}

                  rows={3}

                  maxLength={2000}

                  className={inputClass}

                  placeholder="Any special arrangements requested by the customer..."

                />

              </div>

            </div>

          </section>

          {/* Payment details */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 border-b border-gray-100 pb-4">

              <h2 className="text-lg font-semibold text-gray-900">

                Payment Details

              </h2>

              <p className="mt-1 text-sm text-gray-500">

                Enter the booking amount and advance actually received.

              </p>

            </div>

            {selectedPackage && packagePrice === null && (

              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">

                The package price field could not be identified. Enter the

                total amount manually and ensure the backend validates it.

              </div>

            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>

                <label className={labelClass}>

                  <FaMoneyBillWave className="text-amber-700" />

                  Total Amount (₹) \*

                </label>

                <input

                  name="totalAmount"

                  type="number"

                  min="0"

                  step="0.01"

                  value={form.totalAmount}

                  onChange={updateField}

                  className={inputClass}

                  placeholder="Enter total amount"

                  required

                />

              </div>

<div>
  <label className={labelClass}>
    <FaMoneyBillWave className="text-amber-700" />
    Discount Amount (₹)
  </label>
  <input
    name="discountAmount"
    type="number"
    min="0"
    max={totalAmount}
    step="0.01"
    value={form.discountAmount}
    onChange={updateField}
    className={inputClass}
    placeholder="Enter discount amount"
    required
  />
</div>


              <div>

                <label className={labelClass}>

                  Advance Received (₹) \*

                </label>

                <input

                  name="advanceAmount"

                  type="number"

                  min="0"

                  max={totalAmount}

                  step="0.01"

                  value={form.advanceAmount}

                  onChange={updateField}

                  className={inputClass}

                  required

                />

              </div>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-xs font-medium text-gray-500">

                  Total Amount

                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">

                  {money(totalAmount)}

                </p>

              </div>

<div className="rounded-lg bg-orange-50 p-4">
  <p className="text-xs font-medium text-orange-700">
    Discount
  </p>
  <p className="mt-1 text-xl font-bold text-orange-800">
    -{money(discountAmount)}
  </p>
</div>

<div className="rounded-lg bg-blue-50 p-4">
  <p className="text-xs font-medium text-blue-700">
    Payable Amount
  </p>
  <p className="mt-1 text-xl font-bold text-blue-800">
    {money(payableAmount)}
  </p>
</div>


              <div className="rounded-lg bg-green-50 p-4">

                <p className="text-xs font-medium text-green-700">

                  Advance Received

                </p>

                <p className="mt-1 text-xl font-bold text-green-800">

                  {money(advanceAmount)}

                </p>

              </div>

              <div className="rounded-lg bg-amber-50 p-4">

                <p className="text-xs font-medium text-amber-700">

                  Remaining Amount

                </p>

                <p className="mt-1 text-xl font-bold text-amber-800">

                  {money(remainingAmount)}

                </p>

              </div>

            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">

              <span className="text-gray-500">

                Payment status:

              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold capitalize text-gray-700">

                {paymentStatus.replace("_", " ")}

              </span>

            </div>

            <div className="mt-5">

              <label className={labelClass}>

                Internal Admin Note

              </label>

              <textarea

                name="adminNote"

                value={form.adminNote}

                onChange={updateField}

                rows={2}

                maxLength={2000}

                className={inputClass}

                placeholder="Internal notes for the admin team..."

              />

            </div>

          </section>

          {/* Booking confirmation */}

          <section className="rounded-xl border border-green-200 bg-green-50 p-5 sm:p-6">

            <div className="flex items-start gap-3">

              <FaCheckCircle className="mt-1 text-xl text-green-700" />

              <div>

                <h2 className="font-semibold text-green-900">

                  Booking will be created as Confirmed

                </h2>

                <p className="mt-1 text-sm leading-relaxed text-green-800">

                  Verify the event date, customer details and advance amount

                  before submitting. The backend must check date availability,

                  save the booking, and send the customer email.

                </p>

              </div>

            </div>

          </section>

          {/* Actions */}

          <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">

            <button

              type="button"

              onClick={() => navigate("/admin/bookings")}

              disabled={submitting}

              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"

            >

              Cancel

            </button>

            <button

              type="submit"

              disabled={

                submitting ||

                loadingPackages ||

                loadingBookedDates ||

                packages.length === 0

              }

              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"

            >

              <FaCheckCircle />

              {submitting

                ? "Creating Booking..."

                : "Submit Booking"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}
