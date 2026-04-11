import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

export default function TechnicianLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="technician" />
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <Navbar title="Technician Command Center" subtitle="Incident operations, status control, and maintenance workflow" />
        <main className="mt-5 space-y-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
