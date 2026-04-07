import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", icon: "◻", label: "Dashboard" },
  { to: "/bookings", icon: "◷", label: "Bookings" },
  { to: "/resources", icon: "▣", label: "Resources" },
  { to: "/tickets", icon: "◉", label: "Tickets" },
  { to: "/admin", icon: "◆", label: "Admin Panel" },
  { to: "/notifications", icon: "◌", label: "Notifications" },
];

export default function SidebarNav() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-brand">SLIIT CourseWeb</h2>
      <p className="sidebar-sub">Smart Campus Operations Hub</p>
      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span className="nav-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
