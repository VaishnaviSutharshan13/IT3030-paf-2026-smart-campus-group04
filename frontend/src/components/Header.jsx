import React from "react";
import { LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Header({ title, subtitle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="dashboard-glass-card flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell role={user?.role} />
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
          <ShieldCheck size={14} />
          {String(user?.role || "user").toUpperCase()}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${user?.status === "inactive" ? "border-rose-200 bg-rose-100 text-rose-800" : "border-emerald-200 bg-emerald-100 text-emerald-800"}`}>
          <UserCircle2 size={14} />
          {(user?.name || "Campus User").split(" ")[0]}
        </span>
        <button type="button" onClick={handleLogout} className="btn-secondary inline-flex items-center gap-2">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
