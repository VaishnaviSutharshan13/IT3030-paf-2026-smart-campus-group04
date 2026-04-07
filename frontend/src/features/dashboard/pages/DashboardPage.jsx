import React from "react";
import AppShell from "../../../core/layouts/AppShell";
import KpiCard from "../components/KpiCard";
import SectionCard from "../../../shared/components/SectionCard";

const stats = [
  { label: "Open Tickets", value: 18 },
  { label: "Pending Bookings", value: 7 },
  { label: "Active Resources", value: 63 },
  { label: "Unread Notifications", value: 12 },
];

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Campus operations at a glance">
      <section className="card dashboard-hero">
        <h2>Smart Campus Operations Hub</h2>
        <p>Professional operations dashboard for bookings, incidents, and administration.</p>
      </section>

      <div className="kpi-grid">
        {stats.map((item) => (
          <KpiCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="panel-grid">
        <SectionCard title="Live Activity Feed">
          <div className="dashboard-activity">
            <div className="activity-row">
              <strong>Lab B-21 booking approved</strong>
              <span>2 min ago</span>
            </div>
            <div className="activity-row">
              <strong>Projector issue escalated to technician</strong>
              <span>8 min ago</span>
            </div>
            <div className="activity-row">
              <strong>Admin published maintenance alert</strong>
              <span>17 min ago</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Operations Health">
          <div className="list">
            <div className="list-item">
              <span>Ticket SLA</span>
              <span className="status success">92% on target</span>
            </div>
            <div className="list-item">
              <span>Resource Availability</span>
              <span className="status warning">73% today</span>
            </div>
            <div className="list-item">
              <span>Pending Approvals</span>
              <span className="status danger">7 waiting</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Resource Utilization (Today)">
        <div className="chart-bars">
          <div className="chart-item"><span>Rooms</span><div className="bar"><i style={{ width: "72%" }} /></div><strong>72%</strong></div>
          <div className="chart-item"><span>Labs</span><div className="bar"><i style={{ width: "64%" }} /></div><strong>64%</strong></div>
          <div className="chart-item"><span>Equipment</span><div className="bar"><i style={{ width: "49%" }} /></div><strong>49%</strong></div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
