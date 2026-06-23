import Layout from "@/layout";
import AuthGuard from "@/utils/route-guard/AuthGuard";

import PatientDashboardPage from "@/pages/patient/PatientDashboardPage";
import PatientSessionPage from "@/pages/patient/PatientSessionPage";
import PatientReviewsPage from "@/pages/patient/PatientReviewsPage";

const PatientRoutes = {
  path: "/",
  element: (
    <AuthGuard allowedRoles={["patient"]}>
      <Layout />
    </AuthGuard>
  ),
  children: [
    // Dashboard
    { path: "patient", element: <PatientDashboardPage /> },

    // One session page: setup + countdown + live inside module
    { path: "patient/session", element: <PatientSessionPage /> },

    // Past sessions + therapist feedback
    { path: "patient/reviews", element: <PatientReviewsPage /> },
  ],
};

export default PatientRoutes;
