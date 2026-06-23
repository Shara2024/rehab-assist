import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/contexts/auth-context/authTypes";

export default function AuthGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const { state } = useAuth();

  if (!state.user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(state.user.role))
    return <Navigate to="/login" replace />;

  return <>{children}</>;
}
