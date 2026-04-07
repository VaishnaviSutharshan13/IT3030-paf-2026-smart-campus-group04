import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../app/store/useAuthStore";

export default function TopBar({ title, subtitle }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-controls">
        <Link to="/notifications" className="btn btn-ghost">Notifications</Link>
        <span className="pill">{user?.email || "guest"}</span>
        <button type="button" onClick={logout} className="btn btn-danger">
          Logout
        </button>
      </div>
    </header>
  );
}
