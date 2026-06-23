import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AppLayout() {
  const { state, dispatch } = useAuth();

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <header
        style={{ display: "flex", alignItems: "center", marginBottom: 20 }}
      >
        <h2>Rehab Assist</h2>

        <div style={{ marginLeft: "auto" }}>
          {state.user ? (
            <>
              <span style={{ marginRight: 10 }}>
                {state.user.name} ({state.user.role})
              </span>
              <button onClick={() => dispatch({ type: "AUTH/LOGOUT" })}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: 10 }}>
                Login
              </Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </header>

      <Outlet />
    </div>
  );
}
