import type { AuthUser } from "@/contexts/auth-context/authTypes";

const API_BASE_URL = "http://localhost:5000";

const USERS = [
  {
    email: "rcc_a_001",
    password: "Admin@1234",
    user: {
      id: "a1",
      name: "Rehab Admin",
      role: "admin" as const,
      tenantId: "rehabcare-colombo",
      rehabCenterId: "rehabcare-colombo",
      rehabCenterName: "RehabCare Colombo",
      username: "rcc_a_001",
      email: "admin@rehabcare-colombo.local",
    },
  },
  {
    email: "patient@test.com",
    password: "1234",
    user: {
      id: "p1",
      name: "Test Patient",
      role: "patient" as const,
      tenantId: "tenant-1",
      email: "patient@test.com",
    },
  },
];

export async function loginRequest(
  identifier: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        user: {
          id: data.user.id,
          name: data.user.name,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          tenantId: data.user.rehabCenterId,
          rehabCenterId: data.user.rehabCenterId,
          rehabCenterName: data.user.rehabCenterName,
          username: data.user.username,
          email: data.user.email,
          phone: data.user.phone,
          firstLogin: data.user.firstLogin,
          customFields: data.user.customFields ?? [],
        },
        token: data.token,
      };
    }
  } catch {
    // Fall back to local demo users when the backend is not running.
  }

  await new Promise((r) => setTimeout(r, 300));

  const found = USERS.find((u) => u.email === identifier && u.password === password);

  if (!found) throw new Error("Invalid username or password");

  return {
    user: found.user,
    token: "mock-token",
  };
}
