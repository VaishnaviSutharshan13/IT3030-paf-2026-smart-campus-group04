import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

export default function LecturerLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="lecturer" />
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <Navbar
          title="Lecturer Dashboard"
          subtitle="Manage courses, materials, and student progress"
        />
        <main className="mt-5 space-y-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
