import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useAuth();

  // If already logged in, redirect to dashboard
  if (state.user?.role === "admin") return <Navigate to="/admin" replace />;
  if (state.user?.role === "therapist") return <Navigate to="/therapist" replace />;
  if (state.user) return <Navigate to="/patient" replace />;

  return <>{children}</>;
}
