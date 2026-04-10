import React, { useEffect, useMemo, useState } from "react";
import { GraduationCap, LogOut, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import { sidebarItemsByRole } from "./sidebarConfig";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const links = useMemo(() => sidebarItemsByRole[role] || [], [role]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const sidebarElement = (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-emerald-200/30 bg-gradient-to-b from-[#0B3D2E] via-[#145A46] to-[#1F7A63] text-white shadow-[0_24px_56px_rgba(8,40,30,0.42)] backdrop-blur-xl transition-all duration-300 ease-out"
      style={{ width: sidebarWidth }}
    >
      <div className="flex items-start justify-between px-4 pb-4 pt-5">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15 shadow-lg shadow-emerald-900/30">
            <GraduationCap size={19} />
          </span>
          {!collapsed ? (
            <div className="animate-floatIn">
              <h2 className="text-base font-semibold tracking-wide">Smart Campus</h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/90">Operations Hub</p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="hidden rounded-lg border border-white/20 bg-white/10 p-1.5 transition hover:bg-white/20 lg:inline-flex"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <button
          type="button"
          className="rounded-lg border border-white/20 bg-white/10 p-1.5 transition hover:bg-white/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {links.map((link) => (
          <NavLink
            key={link.key}
            to={link.to}
            end={Boolean(link.end)}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              [
                "nav-ripple group relative flex items-center gap-3 overflow-hidden rounded-xl border-l-4 px-3 py-2.5 text-sm transition-all duration-300",
                "sidebar-nav-link",
                collapsed ? "justify-center" : "",
                isActive
                  ? "border-l-emerald-300 bg-emerald-100/90 text-[#0B3D2E] shadow-lg shadow-emerald-900/15"
                  : "border-l-transparent text-emerald-50 hover:scale-[1.02] hover:bg-white/14 hover:text-white",
              ].join(" ")
            }
          >
            <link.icon size={17} className="shrink-0" />
            {!collapsed ? <span className="font-medium tracking-wide">{link.label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/20 px-3 py-3">
        <div className={`rounded-xl border border-white/20 bg-white/10 px-3 py-2 ${collapsed ? "text-center" : ""}`}>
          <p className="truncate text-xs font-semibold text-white">{user?.name || "Campus User"}</p>
          {!collapsed ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] text-emerald-100">{user?.email || "user@campus.edu"}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {String(role || "user")}
              </span>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={`mt-2 inline-flex w-full items-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 ${collapsed ? "justify-center" : "gap-2"}`}
        >
          <LogOut size={16} />
          {!collapsed ? "Logout" : null}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white/90 p-2 text-campus-700 shadow-lg backdrop-blur lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {!isMobile ? sidebarElement : null}
      {!isMobile ? <div style={{ width: sidebarWidth }} className="hidden shrink-0 lg:block transition-all duration-300" /> : null}

      {isMobile ? (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/35 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
            onClick={() => setMobileOpen(false)}
          />
          <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
            {sidebarElement}
          </div>
        </>
      ) : null}
    </>
  );
}
