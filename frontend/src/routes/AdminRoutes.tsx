import Layout from "@/layout";
import AuthGuard from "@/utils/route-guard/AuthGuard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import { Navigate } from "react-router-dom";

const AdminRoutes = {
  path: "/",
  element: (
    <AuthGuard allowedRoles={["admin"]}>
      <Layout />
    </AuthGuard>
  ),
  children: [
    { path: "admin", element: <AdminUsersPage /> },
    { path: "admin/patients", element: <AdminUsersPage /> },
    { path: "admin/patients/register", element: <AdminUsersPage /> },
    { path: "admin/patients/list", element: <AdminUsersPage /> },
    { path: "admin/patients/active", element: <Navigate to="/admin/patients/list" replace /> },
    { path: "admin/patients/pending", element: <Navigate to="/admin/patients/list" replace /> },
    { path: "admin/therapists", element: <AdminUsersPage /> },
    { path: "admin/therapists/register", element: <AdminUsersPage /> },
    { path: "admin/therapists/list", element: <AdminUsersPage /> },
    { path: "admin/therapists/active", element: <Navigate to="/admin/therapists/list" replace /> },
    { path: "admin/therapists/pending", element: <Navigate to="/admin/therapists/list" replace /> },
    { path: "admin/profile", element: <AdminUsersPage /> },
  ],
};

export default AdminRoutes;
