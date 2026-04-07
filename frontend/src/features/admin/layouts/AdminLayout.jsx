import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../auth/context/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();
  const role = user?.role === "super_admin" ? "super_admin" : "admin";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <Navbar title="Admin Dashboard" subtitle="Manage users, courses, and system reports" />
        <main className="mt-5 space-y-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
