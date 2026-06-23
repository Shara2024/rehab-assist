// import { createBrowserRouter, Navigate } from "react-router-dom";
// import Layout from "@/layout/index";
// import AuthRoutes from "./AuthRoutes";

// import Login from "@/pages/Login";
// import Signup from "@/pages/SignUp";

// import PatientDashboardPage from "@/pages/patient/PatientDashboardPage";
// import ExerciseInstructionsPage from "@/pages/patient/ExerciseInstructionsPage";
// import PatientSessionPage from "@/pages/patient/PatientSessionPage";

// const router = createBrowserRouter([
//   {
//     element: <Layout />,
//     children: [
//       { path: "/", element: <Navigate to="/login" replace /> },

//       { path: "/login", element: <Login /> },
//       { path: "/signup", element: <Signup /> },

//       {
//         element: <AuthRoutes allowedRoles={["patient"]} />,
//         children: [
//           { path: "/patient", element: <PatientDashboardPage /> },
//           {
//             path: "/patient/exercises/:exerciseId",
//             element: <ExerciseInstructionsPage />,
//           },
//           {
//             path: "/patient/exercises/:exerciseId/session",
//             element: <PatientSessionPage />,
//           },
//         ],
//       },
//     ],
//   },
// ]);

// export default router;


import { createBrowserRouter, Navigate } from "react-router-dom";

import AuthRoutesConfig from "@/routes/AuthRoutes";
import PatientRoutes from "@/routes/PatientRoutes";
import AdminRoutes from "@/routes/AdminRoutes";
import ProfileRoutes from "@/routes/ProfileRoutes";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },

  AuthRoutesConfig,
  AdminRoutes,
  ProfileRoutes,
  PatientRoutes,
]);

export default router;
