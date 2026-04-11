import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import RoleRouteRedirect from "./RoleRouteRedirect";
import TechnicianLayout from "../../features/technician/layouts/TechnicianLayout";
import TechnicianTicketsPage from "../../features/technician/pages/TechnicianTicketsPage";

const LoginPage = lazy(() => import("../../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../../features/auth/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../../features/auth/pages/ForgotPasswordPage"));
const LecturerLayout = lazy(() => import("../../features/lecturer/layouts/LecturerLayout"));
const LecturerDashboard = lazy(() => import("../../features/lecturer/pages/Dashboard"));
const ManageCourses = lazy(() => import("../../features/lecturer/pages/ManageCourses"));
const UploadMaterials = lazy(() => import("../../features/lecturer/pages/UploadMaterials"));
const ViewStudents = lazy(() => import("../../features/lecturer/pages/ViewStudents"));
const LecturerBookingsPage = lazy(() => import("../../features/lecturer/pages/LecturerBookingsPage"));
const LecturerIncidentsPage = lazy(() => import("../../features/lecturer/pages/LecturerIncidentsPage"));
const LecturerResourcesPage = lazy(() => import("../../features/lecturer/pages/LecturerResourcesPage"));
const AdminLayout = lazy(() => import("../../features/admin/layouts/AdminLayout"));
const AdminOverview = lazy(() => import("../../features/admin/pages/AdminOverview"));
const AdminUsersPage = lazy(() => import("../../features/admin/pages/AdminUsersPage"));
const AdminBookingsPage = lazy(() => import("../../features/admin/pages/AdminBookingsPage"));
const AdminReportsPage = lazy(() => import("../../features/admin/pages/AdminReportsPage"));
const AdminFacilitiesPage = lazy(() => import("../../features/admin/pages/AdminFacilitiesPage"));
const AdminIncidentsPage = lazy(() => import("../../features/admin/pages/AdminIncidentsPage"));
const StudentLayout = lazy(() => import("../../features/student/layouts/StudentLayout"));
const StudentOverview = lazy(() => import("../../features/student/pages/StudentOverview"));
const StudentCoursesPage = lazy(() => import("../../features/student/pages/StudentCoursesPage"));
const StudentMaterialsPage = lazy(() => import("../../features/student/pages/StudentMaterialsPage"));
const StudentAssignmentsPage = lazy(() => import("../../features/student/pages/StudentAssignmentsPage"));
const StudentStatusPage = lazy(() => import("../../features/student/pages/StudentStatusPage"));
const StudentBookingsPage = lazy(() => import("../../features/student/pages/StudentBookingsPage"));
const NotificationsPage = lazy(() => import("../../features/common/pages/NotificationsPage"));
const TechnicianOverview = lazy(() => import("../../features/technician/pages/TechnicianOverview"));
const TechnicianTasksPage = lazy(() => import("../../features/technician/pages/TechnicianTasksPage"));
const ProfilePage = lazy(() => import("../../features/common/pages/ProfilePage"));
const SettingsPage = lazy(() => import("../../features/common/pages/SettingsPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <section className="panel w-full max-w-md p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-800">Loading...</h1>
        <p className="mt-2 text-sm text-slate-500">Preparing page content.</p>
      </section>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/student-dashboard" element={<StudentLayout />}>
              <Route index element={<StudentOverview />} />
              <Route path="courses" element={<StudentCoursesPage />} />
              <Route path="materials" element={<StudentMaterialsPage />} />
              <Route path="bookings" element={<StudentBookingsPage />} />
              <Route path="assignments" element={<StudentAssignmentsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="status" element={<StudentStatusPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage title="Student Settings" />} />
              <Route path="*" element={<Navigate to="/student-dashboard" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["lecturer"]} />}>
            <Route path="/lecturer-dashboard" element={<LecturerLayout />}>
              <Route index element={<LecturerDashboard />} />
              <Route path="courses" element={<ManageCourses />} />
              <Route path="materials" element={<UploadMaterials />} />
              <Route path="students" element={<ViewStudents />} />
              <Route path="bookings" element={<LecturerBookingsPage />} />
              <Route path="incidents" element={<LecturerIncidentsPage />} />
              <Route path="resources" element={<LecturerResourcesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage title="Lecturer Settings" />} />
              <Route path="*" element={<Navigate to="/lecturer-dashboard" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin-dashboard" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="incidents" element={<AdminIncidentsPage />} />
              <Route path="facilities" element={<AdminFacilitiesPage />} />
              <Route path="resources" element={<AdminFacilitiesPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage title="Admin Settings" />} />
              <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["technician"]} />}>
            <Route path="/technician-dashboard" element={<TechnicianLayout />}>
              <Route index element={<TechnicianOverview />} />
              <Route path="tickets" element={<TechnicianTicketsPage />} />
              <Route path="tasks" element={<TechnicianTasksPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage title="Technician Settings" />} />
              <Route path="*" element={<Navigate to="/technician-dashboard" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["student", "lecturer", "admin", "technician"]} />}>
            <Route path="/dashboard" element={<RoleRouteRedirect section="dashboard" />} />
            <Route path="/courses" element={<RoleRouteRedirect section="courses" />} />
            <Route path="/materials" element={<RoleRouteRedirect section="materials" />} />
            <Route path="/students" element={<RoleRouteRedirect section="students" />} />
            <Route path="/notifications" element={<RoleRouteRedirect section="notifications" />} />
            <Route path="incidents" element={<RoleRouteRedirect section="incidents" />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
