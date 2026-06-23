import type { AuthAction, AuthState } from "./authTypes";

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH/LOGIN_START":
      return { ...state, isLoading: true, error: null };

    case "AUTH/LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };

    case "AUTH/LOGIN_ERROR":
      return { ...state, isLoading: false, error: action.payload.error };

    case "AUTH/RESTORE":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
      };

    case "AUTH/LOGOUT":
      return { ...initialAuthState };

    default:
      return state;
  }
}
