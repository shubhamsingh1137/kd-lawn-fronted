import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaImages,
  FaLayerGroup,
  FaBoxOpen,
  FaUsers,
  FaQuoteLeft,
  FaSignOutAlt,
  FaBell,
  FaQrcode,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaTrash,
  FaWalking,
  FaBullhorn
} from "react-icons/fa";

import api from "../../services/api";

const navItems = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: <FaTachometerAlt />,
    end: true,
  },
  {
    to: "/admin/bookings",
    label: "Bookings",
    icon: <FaCalendarCheck />,
  },
  {
    to: "/admin/gallery",
    label: "Gallery",
    icon: <FaImages />,
  },
  {
    to: "/admin/content",
    label: "Site Content",
    icon: <FaLayerGroup />,
  },
  {
    to: "/admin/packages",
    label: "Packages",
    icon: <FaBoxOpen />,
  },
  {
    to: "/admin/testimonials",
    label: "Testimonials",
    icon: <FaQuoteLeft />,
  },
  {
  to: "/admin/announcements",
  label: "Announcements",
  icon: <FaBullhorn />,
},
  {
  to: "/admin/walk-in-booking",
  label: "Walk-in Booking",
  icon: <FaWalking />,
},
  {
    to: "/admin/users",
    label: "Users",
    icon: <FaUsers />,
  },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notificationRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const response = await api.get("/notifications");

      if (response.data?.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error(
        "Fetch notifications error:",
        error.response?.data || error.message
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  // =========================================================
  // INITIAL FETCH + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // =========================================================

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                status: "read",
              }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error.response?.data || error.message
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: "read",
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error.response?.data || error.message
      );
    }
  };

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();

    try {
      await api.delete(`/notifications/${notificationId}`);

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId)
      );

      // Recalculate unread count
      setUnreadCount((prev) => {
        const deletedNotification = notifications.find(
          (notification) => notification._id === notificationId
        );

        if (deletedNotification?.status === "unread") {
          return Math.max(prev - 1, 0);
        }

        return prev;
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error.response?.data || error.message
      );
    }
  };

  // =========================================================
  // NOTIFICATION CLICK
  // =========================================================

  const handleNotificationClick = async (notification) => {
    if (notification.status === "unread") {
      await markAsRead(notification._id);
    }

    setShowNotifications(false);

    // QR payment notification
    if (
      notification.type === "qr_payment" &&
      notification.booking?._id
    ) {
      navigate(`/admin/bookings/${notification.booking._id}`);
      return;
    }

    // Other booking notifications
    if (notification.booking?._id) {
      navigate(`/admin/bookings/${notification.booking._id}`);
    }
  };

  // =========================================================
  // NOTIFICATION ICON
  // =========================================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "qr_payment":
        return <FaQrcode className="text-blue-500" />;

      case "payment_approved":
        return <FaCheckCircle className="text-green-500" />;

      case "payment_rejected":
        return <FaTimesCircle className="text-red-500" />;

      case "booking":
        return <FaCalendarCheck className="text-purple-500" />;

      default:
        return <FaMoneyBillWave className="text-yellow-500" />;
    }
  };

  // =========================================================
  // NOTIFICATION TIME
  // =========================================================

  const formatNotificationTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const diffInSeconds = Math.floor(
      (now - notificationDate) / 1000
    );

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
      return `${diffInHours} hr ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 1) {
      return "Yesterday";
    }

    return notificationDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

     <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-gray-900 text-white">

        <div className="px-6 py-6 border-b border-gray-700">
          <h1 className="text-gold font-serif text-xl font-bold">
            Kalawati
          </h1>

          <p className="text-gray-400 text-xs mt-1 tracking-widest uppercase">
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">

          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-gold text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="text-base">
                {icon}
              </span>

              {label}
            </NavLink>
          ))}

        </nav>

        <div className="px-3 py-4 border-t border-gray-700">

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FaSignOutAlt />
            Logout
          </button>

        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="ml-64 flex h-screen min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">

        {/* ===================================================
            TOP HEADER
        ==================================================== */}

        <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">

          {/* =================================================
              NOTIFICATION
          ================================================== */}

          <div
            ref={notificationRef}
            className="relative"
          >

            <button
              onClick={() =>
                setShowNotifications((prev) => !prev)
              }
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              title="Notifications"
            >

              <FaBell className="text-gray-700 text-xl" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

            </button>

            {/* =================================================
                NOTIFICATION DROPDOWN
            ================================================== */}

            {showNotifications && (
              <div className="absolute right-0 top-12 w-[390px] max-w-[calc(100vw-30px)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

                {/* Header */}

                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Notifications
                    </h3>

                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {unreadCount} unread
                      </p>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}

                </div>

                {/* Notifications */}

                <div className="max-h-[450px] overflow-y-auto">

                  {loadingNotifications &&
                  notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">

                      <FaBell className="mx-auto text-gray-300 text-3xl mb-3" />

                      <p className="text-gray-500 text-sm">
                        No notifications
                      </p>

                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                        className={`relative px-4 py-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50
                          ${
                            notification.status === "unread"
                              ? "bg-blue-50/50"
                              : "bg-white"
                          }`}
                      >

                        <div className="flex gap-3">

                          {/* Icon */}

                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            {getNotificationIcon(
                              notification.type
                            )}
                          </div>

                          {/* Content */}

                          <div className="flex-1 min-w-0 pr-5">

                            <div className="flex items-start justify-between gap-2">

                              <h4
                                className={`text-sm ${
                                  notification.status === "unread"
                                    ? "font-bold text-gray-900"
                                    : "font-semibold text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </h4>

                              {notification.status === "unread" && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                              )}

                            </div>

                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {notification.message}
                            </p>

                            {/* Payment Details */}

                            {notification.type === "qr_payment" && (
                              <div className="mt-2 space-y-1">

                                {notification.customerName && (
                                  <p className="text-xs text-gray-500">
                                    <span className="font-medium">
                                      Customer:
                                    </span>{" "}
                                    {notification.customerName}
                                  </p>
                                )}

                                {notification.amount > 0 && (
                                  <p className="text-xs text-gray-500">
                                    <span className="font-medium">
                                      Amount:
                                    </span>{" "}
                                    ₹
                                    {Number(
                                      notification.amount
                                    ).toLocaleString("en-IN")}
                                  </p>
                                )}

                              </div>
                            )}

                            <p className="text-[11px] text-gray-400 mt-2">
                              {formatNotificationTime(
                                notification.createdAt
                              )}
                            </p>

                          </div>

                          {/* Delete */}

                          <button
                            onClick={(event) =>
                              deleteNotification(
                                notification._id,
                                event
                              )
                            }
                            className="absolute right-3 top-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete notification"
                          >
                            <FaTrash className="text-xs" />
                          </button>

                        </div>

                      </div>
                    ))
                  )}

                </div>

              </div>
            )}

          </div>

        </header>

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <Outlet />

      </main>
    </div>
  );
}