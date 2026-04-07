import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../../../core/layouts/AppShell";
import Card from "../../../components/Card";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function NotificationsPage() {
  const toast = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  async function markAllAsRead() {
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read.");
      await loadNotifications();
    } catch (error) {
      toast.error(error.message || "Failed to mark all as read.");
    }
  }

  async function toggleRead(target) {
    if (target.read) {
      return;
    }

    try {
      await markNotificationRead(target.id);
      await loadNotifications();
    } catch (error) {
      toast.error(error.message || "Failed to update notification.");
    }
  }

  return (
    <AppShell title="Notifications" subtitle="Recent updates across bookings and tickets">
      <Card
        title="Notification Center"
        actions={
          <div className="notifications-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsDropdownOpen((open) => !open)}>
              Alerts {unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
            <button type="button" className="btn btn-accent" onClick={markAllAsRead}>
              Mark All Read
            </button>
          </div>
        }
      >
        {loading ? <div className="loading">Loading notifications...</div> : null}
        {isDropdownOpen ? (
          <div className="notification-dropdown card">
            {notifications.map((note) => (
              <button
                key={`${note.id}-dropdown`}
                type="button"
                className={`dropdown-item ${!note.read ? "is-unread" : ""}`}
                onClick={() => toggleRead(note)}
              >
                <strong>{note.title}</strong>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="list">
          {notifications.map((note) => (
            <div key={note.id} className={`list-item ${!note.read ? "note-unread" : ""}`}>
              <div>
                <strong>{note.title}</strong>
                <p className="muted-text">{note.message}</p>
              </div>
              <div className="action-row">
                <span className="pill">{new Date(note.createdAt).toLocaleTimeString()}</span>
                <button type="button" className="btn btn-ghost" onClick={() => toggleRead(note)}>
                  {note.read ? "Read" : "Mark Read"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
