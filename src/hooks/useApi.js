// src/hooks/useApi.js
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../services/api";
import toast from "react-hot-toast";

// ── Generic fetch hook ────────────────────────────────────────────────────────
export const useFetch = (key, url, options = {}) =>
  useQuery(key, () => api.get(url).then(r => r.data), options);

// ── Generic mutation hook (POST/PUT/DELETE) ───────────────────────────────────
export const useMutate = ({ method = "post", url, invalidate = [], successMsg }) => {
  const qc = useQueryClient();
  return useMutation(
    (data) => api[method](url, data).then(r => r.data),
    {
      onSuccess: () => {
        if (successMsg) toast.success(successMsg);
        invalidate.forEach(key => qc.invalidateQueries(key));
      },
      onError: (err) => toast.error(err.response?.data?.message || "Something went wrong"),
    }
  );
};

// ── Booking hooks ─────────────────────────────────────────────────────────────
export const useMyBookings = () =>
  useFetch("myBookings", "/bookings/my");

export const useAdminBookings = (status = "") =>
  useFetch(
    ["adminBookings", status],
    `/bookings/admin/all${status ? `?status=${status}` : ""}`
  );

export const useBookingStats = () =>
  useFetch("bookingStats", "/bookings/admin/stats");

// ── Gallery hooks ─────────────────────────────────────────────────────────────
export const useGallery = (category = "all") =>
  useFetch(
    ["gallery", category],
    `/gallery${category !== "all" ? `?category=${category}` : ""}`
  );

export const useAdminGallery = () =>
  useFetch("adminGallery", "/gallery/admin/all");

// ── Package hooks ─────────────────────────────────────────────────────────────
export const usePackages = () =>
  useFetch("packages", "/packages");

export const useAdminPackages = () =>
  useFetch("adminPackages", "/packages/admin/all");

// ── Content hooks ─────────────────────────────────────────────────────────────
export const useHomeContent = () =>
  useFetch("homeContent", "/content/home");

export const useTestimonials = () =>
  useFetch("testimonials", "/content/testimonials");

export const useAdminContent = () =>
  useFetch("allContent", "/content/admin/all");

// ── User hooks ────────────────────────────────────────────────────────────────
export const useAdminUsers = (search = "") =>
  useFetch(
    ["adminUsers", search],
    `/users/admin/all${search ? `?search=${search}` : ""}`
  );
