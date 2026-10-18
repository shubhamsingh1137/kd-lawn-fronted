
import { useEffect, useRef, useState } from "react";
import api from "../services/api";

function ScrollingAnnouncement({ announcement }) {
  const groupRef = useRef(null);
  const [groupWidth, setGroupWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const message = announcement.message || "";
  const duration = Math.max(5, Number(announcement.speed) || 30);
  const direction = announcement.direction === "right" ? "right" : "left";

  useEffect(() => {
    const measure = () => {
      setViewportWidth(window.innerWidth);

      if (groupRef.current) {
        setGroupWidth(groupRef.current.getBoundingClientRect().width);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);

    if (groupRef.current) {
      observer.observe(groupRef.current);
    }

    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [message]);

  // Repeat enough copies to cover the entire banner without blank gaps.
  const copies = groupWidth > 0
    ? Math.max(3, Math.ceil(viewportWidth / groupWidth) + 2)
    : 3;

  return (
    <div
      className="announcement-banner"
      style={{
        backgroundColor: announcement.backgroundColor || "#8B1E3F",
        color: announcement.textColor || "#FFFFFF",
      }}
      aria-label="Announcement"
    >
      <div
        className={`announcement-track announcement-${direction}`}
        style={{
          "--group-width": `${groupWidth}px`,
          "--scroll-duration": `${duration}s`,
          animationPlayState: groupWidth > 0 ? "running" : "paused",
        }}
      >
        {Array.from({ length: copies }, (_, index) => (
          <div
            key={index}
            ref={index === 0 ? groupRef : null}
            className="announcement-group"
            aria-hidden={index === 0 ? undefined : "true"}
          >
            <span className="announcement-message">{message}</span>
            <span className="announcement-separator">✦</span>
          </div>
        ))}
      </div>

      <style>{`
        .announcement-banner {
  position: relative;
  display: block;
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  overflow: hidden;
  padding: 10px 0;
  line-height: 20px;
}

        .announcement-track {
          display: flex;
          width: max-content;
          align-items: center;
          will-change: transform;
          animation-duration: var(--scroll-duration, 30s);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .announcement-left {
          animation-name: announcement-scroll-left;
        }

        .announcement-right {
          animation-name: announcement-scroll-right;
        }

        .announcement-group {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 48px;
          padding-right: 48px;
          white-space: nowrap;
        }

        .announcement-message {
          display: inline-block;
          flex: 0 0 auto;
          font-size: 14px;
          font-weight: 700;
        }

        .announcement-separator {
          flex: 0 0 auto;
          font-size: 16px;
        }

        @keyframes announcement-scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-1 * var(--group-width)));
          }
        }

        @keyframes announcement-scroll-right {
          from {
            transform: translateX(calc(-1 * var(--group-width)));
          }
          to {
            transform: translateX(0);
          }
        }

        @media (min-width: 768px) {
          .announcement-message {
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .announcement-track {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchAnnouncements = async () => {
      try {
        const response = await api.get("/announcements/active");

        if (mounted && response.data?.success) {
          setAnnouncements(response.data.announcements || []);
        }
      } catch (error) {
        console.error(
          "Failed to load announcements:",
          error.response?.data || error.message
        );
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!announcements.length) return null;

  return (
    <div className="w-full">
      {announcements.map((announcement) => (
        <ScrollingAnnouncement
          key={announcement._id}
          announcement={announcement}
        />
      ))}
    </div>
  );
}
