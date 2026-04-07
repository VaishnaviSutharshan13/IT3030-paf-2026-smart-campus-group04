import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../shared/components/feedback/ToastProvider";
import { createUser, deleteUser, getUsers, updateUser } from "../services/adminApi";
import { useAuth } from "../../auth/context/AuthContext";

const roles = ["super_admin", "admin", "lecturer", "student", "technician"];
const registerableRoles = ["student", "lecturer", "technician"];
const initial = { name: "", email: "", password: "", role: "student" };

export default function AdminUsersPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const hasData = useMemo(() => users.length > 0, [users.length]);
  const currentRole = String(user?.role || "");
  const isSuperAdmin = currentRole === "super_admin";

  const allowedCreateRoles = isSuperAdmin ? roles : registerableRoles;

  async function loadUsers(filters = {}) {
    setLoading(true);
    try {
      const data = await getUsers(filters);
      setUsers(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers({ search, role: roleFilter, status: statusFilter });
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (!allowedCreateRoles.includes(form.role)) {
      setForm((prev) => ({ ...prev, role: allowedCreateRoles[0] || "student" }));
    }
  }, [allowedCreateRoles, form.role]);

  async function handleCreate(event) {
    event.preventDefault();

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.password)) {
      toast.error("Password must be 8+ chars with upper, lower, number, symbol.");
      return;
    }

    try {
      await createUser(form);
      toast.success("User created successfully.");
      setForm(initial);
      loadUsers({ search, role: roleFilter, status: statusFilter });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleRoleUpdate(userId, role) {
    try {
      await updateUser(userId, { role });
      toast.success("Role updated.");
      loadUsers({ search, role: roleFilter, status: statusFilter });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleStatusUpdate(userId, status) {
    try {
      await updateUser(userId, { status });
      toast.success("Status updated.");
      loadUsers({ search, role: roleFilter, status: statusFilter });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete(userId) {
    try {
      await deleteUser(userId);
      toast.success("User deleted.");
      loadUsers({ search, role: roleFilter, status: statusFilter });
    } catch (error) {
      toast.error(error.message);
    }
  }

  function canManageRow(rowRole) {
    if (isSuperAdmin) return true;
    return !["admin", "super_admin"].includes(rowRole);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Manage Users</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="input-field"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input-field" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {loading ? <p className="mt-3 text-sm text-slate-500">Loading users...</p> : null}
        {!loading && !hasData ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
        {hasData ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Delete</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-emerald-100">
                    <td className="px-3 py-2">{user.name}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-emerald-200 px-2 py-1"
                        value={user.role}
                        disabled={!canManageRow(user.role)}
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                      >
                        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-emerald-200 px-2 py-1"
                        value={user.status || "active"}
                        disabled={!canManageRow(user.role)}
                        onChange={(e) => handleStatusUpdate(user.id, e.target.value)}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs text-rose-600 disabled:opacity-50"
                        disabled={!canManageRow(user.role)}
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Create User</h2>
        <form className="mt-4 grid gap-3" onSubmit={handleCreate}>
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="input-field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <input className="input-field" placeholder="Password" type="password" minLength={8} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          <select className="input-field" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
            {allowedCreateRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <button type="submit" className="btn-primary">Create User</button>
        </form>
      </div>
    </section>
  );
}
