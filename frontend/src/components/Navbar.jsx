import React from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar({ title, subtitle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="panel flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell role={user?.role} />
        <span className="inline-flex items-center gap-1 rounded-lg bg-campus-100 px-2.5 py-1 text-xs font-semibold text-campus-700">
          <ShieldCheck size={14} />
          {String(user?.role || "user").toUpperCase()}
        </span>
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${user?.status === "inactive" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
          {(user?.status || "active").toUpperCase()}
        </span>
        <button type="button" onClick={handleLogout} className="btn-secondary inline-flex items-center gap-2">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
