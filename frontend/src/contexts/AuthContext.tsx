import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
} from "react";
import type { Dispatch, ReactNode } from "react";
import type { AuthAction, AuthState, Role } from "@/contexts/auth-context/authTypes";
import { authReducer, initialAuthState } from "@/contexts/auth-context/authReducer";

const STORAGE_KEY = "rehabassist_auth";

type AuthContextValue = {
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
  hasRole: (roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getInitialAuthState(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialAuthState;

  try {
    const parsed = JSON.parse(raw) as {
      user: AuthState["user"];
      token: string;
    };
    if (parsed?.user && parsed?.token) {
      return {
        user: parsed.user,
        token: parsed.token,
        isLoading: false,
        error: null,
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return initialAuthState;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState, getInitialAuthState);

  // Persist only minimal auth
  useEffect(() => {
    if (state.user && state.token) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: state.user, token: state.token }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.user, state.token]);

  const hasRole = (roles: Role[]) =>
    !!state.user && roles.includes(state.user.role);

  const value = useMemo(() => ({ state, dispatch, hasRole }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
