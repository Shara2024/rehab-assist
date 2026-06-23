import type { AuthUser } from "@/contexts/auth-context/authTypes";

const API_BASE_URL = "http://localhost:5000";

export type UpdateOwnProfileInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customFields: {
    fieldId: string;
    value: string;
  }[];
};

export async function getOwnProfile(id: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/profile/${id}`);
  if (!response.ok) throw new Error("Could not load profile");
  const data = await response.json();
  return mapApiUser(data.user);
}

export async function updateOwnProfile(
  id: string,
  input: UpdateOwnProfileInput,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/profile/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not update profile");
  }

  const data = await response.json();
  return mapApiUser(data.user);
}

function mapApiUser(user: AuthUser & { rehabCenterId?: string }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    tenantId: user.rehabCenterId ?? user.tenantId ?? "",
    rehabCenterId: user.rehabCenterId,
    rehabCenterName: user.rehabCenterName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    firstLogin: user.firstLogin,
    customFields: user.customFields ?? [],
  };
}
