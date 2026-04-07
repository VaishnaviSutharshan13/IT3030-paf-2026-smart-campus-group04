import React, { useEffect, useMemo, useState } from "react";
import { CheckCheck, Filter, Trash2 } from "lucide-react";
import {
  clearAllNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../notifications/services/notificationApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

function getTimeAgo(dateValue) {
  const date = new Date(dateValue);
  const diffSec = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function NotificationsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function loadNotifications(currentFilter = filter, currentPage = page) {
    setLoading(true);
    try {
      const response = await getNotifications({
        filter: currentFilter,
        page: currentPage,
        limit,
      });
      setItems(response?.items || []);
      setTotal(Number(response?.total || 0));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(filter, page);
    const interval = setInterval(() => loadNotifications(filter, page), 10000);
    return () => clearInterval(interval);
  }, [filter, page]);

  async function onRead(itemId) {
    try {
      await markNotificationRead(itemId);
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, is_read: true } : item)));
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function onMarkAllRead() {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read.");
      loadNotifications(filter, page);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onClearAll() {
    setBusy(true);
    try {
      await clearAllNotifications();
      toast.success("Notifications cleared.");
      setPage(1);
      loadNotifications(filter, 1);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500">Real-time updates for bookings, incidents, materials, and announcements.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-campus-700 transition hover:bg-emerald-50 disabled:opacity-60"
              onClick={onMarkAllRead}
              disabled={busy}
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              onClick={onClearAll}
              disabled={busy}
            >
              <Trash2 size={14} />
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-campus-700">
            <Filter size={14} />
            Filter
          </div>
          <div className="flex gap-2">
            {[
              { value: "all", label: "All" },
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === option.value ? "bg-campus-600 text-white" : "bg-emerald-50 text-campus-700 hover:bg-emerald-100"}`}
                onClick={() => {
                  setFilter(option.value);
                  setPage(1);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-sm text-slate-500">Loading notifications...</p> : null}
        {!loading && items.length === 0 ? <p className="text-sm text-slate-500">No notifications available</p> : null}

        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className={`rounded-xl border px-3 py-3 ${item.is_read ? "border-emerald-100" : "border-campus-300 bg-emerald-50/70"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-campus-700">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{getTimeAgo(item.created_at)}</p>
                </div>
                {!item.is_read ? (
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-campus-700 transition hover:bg-emerald-50"
                    onClick={() => onRead(item.id)}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-campus-700 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <span className="text-xs text-slate-500">Page {page} / {totalPages}</span>
            <button
              type="button"
              className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-campus-700 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
