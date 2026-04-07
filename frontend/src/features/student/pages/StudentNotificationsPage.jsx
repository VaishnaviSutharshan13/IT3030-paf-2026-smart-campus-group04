import React, { useEffect, useState } from "react";
import { deleteNotification, getNotifications, markNotificationRead } from "../../notifications/services/notificationApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function StudentNotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);

  async function loadNotifications() {
    try {
      const data = await getNotifications({ page: 1, limit: 50 });
      setNotifications(data?.items || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function onRead(id) {
    try {
      await markNotificationRead(id);
      loadNotifications();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function onDelete(id) {
    try {
      await deleteNotification(id);
      loadNotifications();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Notifications</h2>
      {notifications.length === 0 ? <p className="mt-3 text-sm text-slate-500">You have no notifications right now.</p> : null}
      <div className="mt-4 space-y-3">
        {notifications.map((item) => (
          <div key={item._id || item.id} className={`rounded-xl border p-3 ${item.isRead ? "border-emerald-100" : "border-campus-300 bg-emerald-50/50"}`}>
            <p className="text-sm text-slate-700">{item.message}</p>
            <div className="mt-2 flex gap-3">
              {!item.isRead ? <button type="button" className="text-xs font-semibold text-campus-700" onClick={() => onRead(item._id || item.id)}>Mark as read</button> : null}
              <button type="button" className="text-xs text-rose-600" onClick={() => onDelete(item._id || item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
