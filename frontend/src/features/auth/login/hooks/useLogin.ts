import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authActions } from "@/contexts/auth-context/authAction";
import { loginRequest } from "@/services/AuthService";

export function useLogin() {
  const { dispatch } = useAuth();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    dispatch(authActions.loginStart());

    try {
      const { user, token } = await loginRequest(email, password);

      dispatch(authActions.loginSuccess(user, token));

      // Role-based redirect
      if (user.role === "patient") navigate("/patient");
      else if (user.role === "therapist") navigate("/therapist");
      else navigate("/admin");

      return true;
    } catch (error) {
      dispatch(
        authActions.loginError(
          error instanceof Error ? error.message : "Login failed",
        ),
      );
      return false;
    }
  };

  return { login };
}
