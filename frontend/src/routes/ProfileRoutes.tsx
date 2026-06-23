import Layout from "@/layout";
import ProfilePage from "@/pages/ProfilePage";
import AuthGuard from "@/utils/route-guard/AuthGuard";

const ProfileRoutes = {
  path: "/",
  element: (
    <AuthGuard allowedRoles={["patient", "therapist"]}>
      <Layout />
    </AuthGuard>
  ),
  children: [{ path: "profile", element: <ProfilePage /> }],
};

export default ProfileRoutes;
