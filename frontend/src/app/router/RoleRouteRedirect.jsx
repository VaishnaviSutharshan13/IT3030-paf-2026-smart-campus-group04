import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

const rolePaths = {
  dashboard: {
    admin: "/admin-dashboard",
    lecturer: "/lecturer-dashboard",
    student: "/student-dashboard",
    technician: "/technician-dashboard",
  },
  courses: {
    admin: "/admin-dashboard/courses",
    lecturer: "/lecturer-dashboard/courses",
    student: "/student-dashboard/courses",
    technician: "/technician-dashboard",
  },
  materials: {
    admin: "/admin-dashboard/reports",
    lecturer: "/lecturer-dashboard/materials",
    student: "/student-dashboard/materials",
    technician: "/technician-dashboard",
  },
  students: {
    admin: "/admin-dashboard/users",
    lecturer: "/lecturer-dashboard/students",
    student: "/student-dashboard",
    technician: "/technician-dashboard/tickets",
  },
  notifications: {
    admin: "/admin-dashboard/notifications",
    lecturer: "/lecturer-dashboard/notifications",
    student: "/student-dashboard/notifications",
    technician: "/technician-dashboard/notifications",
  },
};

export default function RoleRouteRedirect({ section }) {
  const { user } = useAuth();
  const path = rolePaths[section]?.[user?.role] || "/login";
  return <Navigate to={path} replace />;
}
