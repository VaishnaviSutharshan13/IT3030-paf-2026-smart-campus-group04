import React, { useEffect, useState } from "react";
import AppShell from "../../../core/layouts/AppShell";
import SectionCard from "../../../shared/components/SectionCard";
import { fetchAdminOverview, fetchUsers, updateUserRole } from "../services/adminService";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function AdminPanelPage() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [overviewData, usersData] = await Promise.all([fetchAdminOverview(), fetchUsers()]);
      setOverview(overviewData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      toast.error(error.message || "Failed to load admin panel data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function onRoleChange(userId, role) {
    try {
      await updateUserRole(userId, role);
      toast.success("User role updated.");
      await loadAdminData();
    } catch (error) {
      toast.error(error.message || "Failed to update role.");
    }
  }

  return (
    <AppShell title="Admin Panel" subtitle="Control access, resources, and approvals">
      <SectionCard title="System Overview">
        {loading ? <div className="loading">Loading admin overview...</div> : null}
        {overview ? (
          <div className="kpi-grid">
            <article className="card kpi-card"><p className="kpi-label">Total Users</p><strong className="kpi-value">{overview.totalUsers}</strong></article>
            <article className="card kpi-card"><p className="kpi-label">Active Resources</p><strong className="kpi-value">{overview.activeResources}</strong></article>
            <article className="card kpi-card"><p className="kpi-label">Total Tickets</p><strong className="kpi-value">{overview.totalTickets}</strong></article>
            <article className="card kpi-card"><p className="kpi-label">Pending Bookings</p><strong className="kpi-value">{overview.pendingBookings}</strong></article>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="User Management">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.active ? "Active" : "Inactive"}</td>
                  <td>
                    <select
                      className="input role-select"
                      value={user.roles?.[0] || "USER"}
                      onChange={(event) => onRoleChange(user.id, event.target.value)}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="TECHNICIAN">TECHNICIAN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
