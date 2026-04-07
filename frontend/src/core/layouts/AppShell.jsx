import React from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function AppShell({ title, subtitle, children, role }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <Navbar title={title} subtitle={subtitle} />
        <main className="mt-5 space-y-5">{children}</main>
      </div>
    </div>
  );
}
