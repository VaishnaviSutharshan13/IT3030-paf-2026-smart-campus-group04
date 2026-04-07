import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  clearAllNotifications,
  getNotificationSummary,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../features/notifications/services/notificationApi";
import { useToast } from "../shared/components/feedback/ToastProvider";

function getNotificationRoute(role) {
  if (role === "admin" || role === "super_admin") return "/admin-dashboard/notifications";
  if (role === "lecturer") return "/lecturer-dashboard/notifications";
  if (role === "technician") return "/technician-dashboard/notifications";
  return "/student-dashboard/notifications";
}

function getTimeAgo(dateValue) {
  const date = new Date(dateValue);
  const diffSec = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function NotificationBell({ role }) {
  const toast = useToast();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const route = useMemo(() => getNotificationRoute(role), [role]);

  async function loadData() {
    try {
      const [summary, list] = await Promise.all([
        getNotificationSummary(),
        getNotifications({ page: 1, limit: 7 }),
      ]);
      setUnread(Number(summary?.unread || 0));
      setItems(list?.items || []);
    } catch {
      // Silent in navbar polling.
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onDocumentClick(event) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", onDocumentClick);
    }

    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [open]);

  async function onItemClick(item) {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
      } catch {
        // Keep UX smooth.
      }
    }
    loadData();
    setOpen(false);
    navigate(route);
  }

  async function onMarkAllRead() {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read.");
      loadData();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onClearAll() {
    setLoading(true);
    try {
      await clearAllNotifications();
      toast.success("Notifications cleared.");
      loadData();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-white text-campus-700 transition hover:bg-emerald-50"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            <span className="text-xs text-slate-500">{unread} unread</span>
          </div>

          {items.length === 0 ? <p className="rounded-xl bg-emerald-50 px-3 py-4 text-sm text-slate-500">No notifications available</p> : null}

          <div className="max-h-72 space-y-2 overflow-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick(item)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition hover:border-emerald-200 hover:bg-emerald-50 ${item.is_read ? "border-emerald-100 bg-white" : "border-emerald-200 bg-emerald-50/70"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-campus-700">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-700">{item.message}</p>
                <p className="mt-1 text-[11px] text-slate-500">{getTimeAgo(item.created_at)}</p>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-campus-700 transition hover:bg-emerald-50 disabled:opacity-60"
              onClick={onMarkAllRead}
              disabled={loading}
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              onClick={onClearAll}
              disabled={loading}
            >
              <Trash2 size={14} />
              Clear all
            </button>
          </div>

          <button
            type="button"
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => {
              setOpen(false);
              navigate(route);
            }}
          >
            View all notifications
          </button>
        </div>
      ) : null}
    </div>
  );
}
