import type { Role } from "@/contexts/auth-context/authTypes";

const API_BASE_URL = "http://localhost:5000";

export type ManagedUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: Extract<Role, "therapist" | "patient">;
  username: string;
  email: string;
  phone: string;
  customFields: ManagedUserCustomField[];
  firstLogin: boolean;
  isActive: boolean;
  createdAt: string;
};

export type ManagedUserCustomField = {
  fieldId: string;
  label: string;
  value: string;
  editableByUser: boolean;
};

export type ProfileFieldDefinition = {
  id: string;
  role: ManagedUser["role"];
  key: string;
  label: string;
  editableByUser: boolean;
  isActive: boolean;
};

export type RehabCenterProfile = {
  id: string;
  name: string;
  code: string;
  email: string;
  registrationNo: string;
  phone: string;
  address: string;
};

export type DashboardSummary = {
  activePatients: number;
  activeTherapists: number;
  pendingPatients: number;
  pendingTherapists: number;
  inactiveAccounts: number;
};

export type CreateManagedUserInput = {
  role: ManagedUser["role"];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customFields?: Pick<ManagedUserCustomField, "fieldId" | "value">[];
};

export type UpdateManagedUserInput = Omit<
  CreateManagedUserInput,
  "role"
> & {
  isActive: boolean;
};

export async function getAdminDashboard(): Promise<{
  summary: DashboardSummary;
  recentUsers: ManagedUser[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`);
  if (!response.ok) throw new Error("Could not load dashboard");
  return response.json();
}

export async function getRehabCenterProfile(): Promise<RehabCenterProfile> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rehab-center`);
  if (!response.ok) throw new Error("Could not load rehab center profile");
  const data = await response.json();
  return data.rehabCenter;
}

export async function updateRehabCenterProfile(
  input: Omit<RehabCenterProfile, "id" | "code">,
): Promise<RehabCenterProfile> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rehab-center`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not update rehab center profile");
  }

  const data = await response.json();
  return data.rehabCenter;
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`);
  if (!response.ok) throw new Error("Could not load users");
  const data = await response.json();
  return data.users;
}

export async function getProfileFields(
  role: ManagedUser["role"],
): Promise<ProfileFieldDefinition[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/profile-fields/${role}`);
  if (!response.ok) throw new Error("Could not load profile fields");
  const data = await response.json();
  return data.fields;
}

export async function createProfileField(
  role: ManagedUser["role"],
  input: { label: string; editableByUser: boolean },
): Promise<ProfileFieldDefinition> {
  const response = await fetch(`${API_BASE_URL}/api/admin/profile-fields/${role}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not create profile field");
  }

  const data = await response.json();
  return data.field;
}

export async function updateProfileField(
  role: ManagedUser["role"],
  id: string,
  input: { label: string; editableByUser: boolean },
): Promise<ProfileFieldDefinition> {
  const response = await fetch(`${API_BASE_URL}/api/admin/profile-fields/${role}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not update profile field");
  }

  const data = await response.json();
  return data.field;
}

export async function deleteProfileField(
  role: ManagedUser["role"],
  id: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/profile-fields/${role}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not delete profile field");
  }
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<{
  user: ManagedUser;
  credentials: { username: string; temporaryPassword: string };
}> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not create user");
  }

  return response.json();
}

export async function updateManagedUser(
  id: string,
  input: UpdateManagedUserInput,
): Promise<ManagedUser> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not update user");
  }

  const data = await response.json();
  return data.user;
}

export async function deleteManagedUser(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not delete user");
  }
}
