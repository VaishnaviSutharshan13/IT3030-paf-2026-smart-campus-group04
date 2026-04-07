import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

export default function StudentLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="student" />
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <Navbar title="Student Dashboard" subtitle="View courses, materials, and assignment status" />
        <main className="mt-5 space-y-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
