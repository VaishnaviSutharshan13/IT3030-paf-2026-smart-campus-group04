import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, PlusCircle, Shield, Users } from "lucide-react";
import AppShell from "../../../core/layouts/AppShell";
import { createUser, deleteUser, getSystemStats, getUsers, updateUser } from "../../admin/services/adminApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const ROLES = ["STUDENT", "LECTURER", "ADMIN"];
const initialForm = { name: "", email: "", password: "", role: "STUDENT" };

export default function AdminDashboardPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const totalUsers = useMemo(() => stats?.totalUsers || users.length, [stats?.totalUsers, users.length]);

  async function loadData() {
    setLoading(true);
    try {
      const [userRows, statsPayload] = await Promise.all([getUsers(), getSystemStats()]);
      setUsers(userRows);
      setStats(statsPayload);
    } catch (error) {
      toast.error(error.message || "Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function onFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onCreateUser(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const created = await createUser(form);
      setUsers((prev) => [...prev, created]);
      setForm(initialForm);
      toast.success("User created successfully.");
      loadData();
    } catch (error) {
      toast.error(error.message || "Could not create user.");
    } finally {
      setSaving(false);
    }
  }

  async function onRoleChange(userId, role) {
    try {
      await updateUser(userId, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success("Role updated.");
      loadData();
    } catch (error) {
      toast.error(error.message || "Role update failed.");
    }
  }

  async function onDelete(userId) {
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted.");
      loadData();
    } catch (error) {
      toast.error(error.message || "Unable to delete user.");
    }
  }

  return (
    <AppShell role="ADMIN" title="Admin Dashboard" subtitle="Manage users, assign roles, and monitor platform health">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Total Users</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{totalUsers}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Students</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{stats?.roleCounts?.STUDENT || 0}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Lecturers</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{stats?.roleCounts?.LECTURER || 0}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Admins</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{stats?.roleCounts?.ADMIN || 0}</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div id="users" className="panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users className="text-campus-600" size={18} />
            Manage Users
          </h2>

          {loading ? <p className="mt-4 text-sm text-slate-500">Loading users...</p> : null}

          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-emerald-100">
                    <td className="px-3 py-2 text-slate-700">{user.name}</td>
                    <td className="px-3 py-2 text-slate-600">{user.email}</td>
                    <td className="px-3 py-2">
                      <select
                        value={user.role}
                        onChange={(event) => onRoleChange(user.id, event.target.value)}
                        className="rounded-lg border border-emerald-100 bg-white px-2 py-1 text-xs font-semibold text-campus-700"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => onDelete(user.id)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-5">
          <section id="roles" className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Shield className="text-campus-600" size={18} />
              Assign Roles
            </h2>
            <p className="mt-2 text-sm text-slate-500">Update role access directly from the users table.</p>
          </section>

          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <PlusCircle className="text-campus-600" size={18} />
              Create User
            </h2>
            <form className="mt-4 grid gap-3" onSubmit={onCreateUser}>
              <input className="input-field" name="name" value={form.name} onChange={onFormChange} placeholder="Full name" required />
              <input className="input-field" type="email" name="email" value={form.email} onChange={onFormChange} placeholder="Email" required />
              <input className="input-field" type="password" name="password" value={form.password} onChange={onFormChange} placeholder="Password" required minLength={6} />
              <select className="input-field" name="role" value={form.role} onChange={onFormChange}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Creating..." : "Create User"}</button>
            </form>
          </section>

          <section id="stats" className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <BarChart3 className="text-campus-600" size={18} />
              System Stats
            </h2>
            <div className="mt-3 space-y-2">
              {(stats?.recentUsers || []).map((item) => (
                <div key={item.id} className="rounded-lg border border-emerald-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role} • {item.email}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}
