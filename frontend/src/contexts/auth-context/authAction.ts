import type { AuthUser } from "./authTypes";

export const authActions = {
  loginStart: () => ({ type: "AUTH/LOGIN_START" as const }),
  loginSuccess: (user: AuthUser, token: string) => ({
    type: "AUTH/LOGIN_SUCCESS" as const,
    payload: { user, token },
  }),
  loginError: (error: string) => ({
    type: "AUTH/LOGIN_ERROR" as const,
    payload: { error },
  }),
  logout: () => ({ type: "AUTH/LOGOUT" as const }),
  restore: (user: AuthUser, token: string) => ({
    type: "AUTH/RESTORE" as const,
    payload: { user, token },
  }),
};
