// import { Navigate, Outlet } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import type { Role } from "@/contexts/auth-context/authTypes";

// export default function AuthRoutes({ allowedRoles }: { allowedRoles: Role[] }) {
//   const { state } = useAuth();

//   if (!state.user) return <Navigate to="/login" replace />;
//   if (!allowedRoles.includes(state.user.role))
//     return <Navigate to="/login" replace />;

//   return <Outlet />;
// }

import Login from "@/pages/Login";
import Signup from "@/pages/SignUp";
import GuestGuard from "@/utils/route-guard/GuestGuard";

const AuthRoutes = {
  path: "/",
  children: [
    {
      path: "login",
      element: (
        <GuestGuard>
          <Login />
        </GuestGuard>
      ),
    },
    {
      path: "signup",
      element: (
        <GuestGuard>
          <Signup />
        </GuestGuard>
      ),
    },
  ],
};

export default AuthRoutes;
