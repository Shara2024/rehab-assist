export type Role = "admin" | "therapist" | "patient";

export type AuthCustomField = {
  fieldId: string;
  label: string;
  value: string;
  editableByUser: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  tenantId: string;
  rehabCenterId?: string;
  rehabCenterName?: string;
  username?: string;
  email: string;
  phone?: string;
  firstLogin?: boolean;
  customFields?: AuthCustomField[];
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

export type AuthAction =
  | { type: "AUTH/LOGIN_START" }
  | { type: "AUTH/LOGIN_SUCCESS"; payload: { user: AuthUser; token: string } }
  | { type: "AUTH/LOGIN_ERROR"; payload: { error: string } }
  | { type: "AUTH/LOGOUT" }
  | { type: "AUTH/RESTORE"; payload: { user: AuthUser; token: string } };
