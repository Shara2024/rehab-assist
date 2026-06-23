import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Copy,
  Mail,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UserRoundPlus,
  Users,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createManagedUser,
  createProfileField,
  deleteManagedUser,
  deleteProfileField,
  getAdminDashboard,
  getManagedUsers,
  getProfileFields,
  getRehabCenterProfile,
  updateManagedUser,
  updateProfileField,
  updateRehabCenterProfile,
  type CreateManagedUserInput,
  type DashboardSummary,
  type ManagedUser,
  type ProfileFieldDefinition,
  type RehabCenterProfile,
  type UpdateManagedUserInput,
} from "@/services/AdminService";

type RoleScope = "patient" | "therapist";
type PageMode = "dashboard" | "center-profile" | "register" | "list";
type StatusFilter = "all" | "active" | "pending" | "inactive";

const emptyPatientForm: CreateManagedUserInput = {
  role: "patient",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const emptyTherapistForm: CreateManagedUserInput = {
  ...emptyPatientForm,
  role: "therapist",
};

export default function AdminUsersModule() {
  const { pathname } = useLocation();
  const routeState = useMemo(() => getRouteState(pathname), [pathname]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [centerProfile, setCenterProfile] = useState<RehabCenterProfile | null>(null);
  const [form, setForm] = useState<CreateManagedUserInput>(
    routeState.role === "therapist" ? emptyTherapistForm : emptyPatientForm,
  );
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateManagedUserInput | null>(null);
  const [profileFields, setProfileFields] = useState<ProfileFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldEditableByUser, setNewFieldEditableByUser] = useState(true);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldLabel, setEditingFieldLabel] = useState("");
  const [editingFieldEditableByUser, setEditingFieldEditableByUser] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [centerForm, setCenterForm] = useState<Omit<RehabCenterProfile, "id" | "code"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    temporaryPassword: string;
    email: string;
  } | null>(null);
  const [createdAccount, setCreatedAccount] = useState<ManagedUser | null>(null);

  useEffect(() => {
    setForm(routeState.role === "therapist" ? emptyTherapistForm : emptyPatientForm);
    setCreatedCredentials(null);
    setCreatedAccount(null);
    setEditingUserId(null);
    setEditForm(null);
    setCustomFieldValues({});
    setNewFieldLabel("");
    setNewFieldEditableByUser(true);
    setEditingFieldId(null);
    setEditingFieldLabel("");
    setEditingFieldEditableByUser(true);
    setSearchTerm("");
    setStatusFilter("all");
  }, [routeState.role, routeState.mode]);

  useEffect(() => {
    if (!routeState.role) {
      setProfileFields([]);
      return;
    }

    void loadProfileFields(routeState.role);
  }, [routeState.role]);

  async function loadData() {
    setError(null);
    try {
      const [userList, dashboard, profile] = await Promise.all([
        getManagedUsers(),
        getAdminDashboard(),
        getRehabCenterProfile(),
      ]);
      setUsers(userList);
      setSummary(dashboard.summary);
      setCenterProfile(profile);
      setCenterForm({
        name: profile.name,
        email: profile.email,
        registrationNo: profile.registrationNo,
        phone: profile.phone,
        address: profile.address,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin data");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function loadProfileFields(role: RoleScope) {
    setError(null);
    try {
      const fields = await getProfileFields(role);
      setProfileFields(fields);
      setCustomFieldValues((current) =>
        fields.reduce<Record<string, string>>((values, field) => {
          values[field.id] = current[field.id] ?? "";
          return values;
        }, {}),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile fields");
    }
  }

  const scopedUsers = useMemo(() => {
    if (!routeState.role) return users;
    return users.filter((user) => user.role === routeState.role);
  }, [routeState.role, users]);

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const searchedUsers = normalizedSearch
      ? scopedUsers.filter((user) =>
          [user.name, user.username, user.email, user.phone]
            .concat((user.customFields ?? []).map((field) => field.value))
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch)),
        )
      : scopedUsers;

    if (statusFilter === "pending") {
      return searchedUsers.filter((user) => user.isActive && user.firstLogin);
    }
    if (statusFilter === "active") {
      return searchedUsers.filter((user) => user.isActive && !user.firstLogin);
    }
    if (statusFilter === "inactive") {
      return searchedUsers.filter((user) => !user.isActive);
    }
    return searchedUsers;
  }, [scopedUsers, searchTerm, statusFilter]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setCreatedCredentials(null);
    setCreatedAccount(null);

    try {
      const result = await createManagedUser({
        ...form,
        customFields: profileFields.map((field) => ({
          fieldId: field.id,
          value: customFieldValues[field.id] ?? "",
        })),
      });
      setUsers((current) => [result.user, ...current]);
      setCreatedCredentials({
        ...result.credentials,
        email: result.user.email,
      });
      setCreatedAccount(result.user);
      setForm(routeState.role === "therapist" ? emptyTherapistForm : emptyPatientForm);
      setCustomFieldValues(
        profileFields.reduce<Record<string, string>>((values, field) => {
          values[field.id] = "";
          return values;
        }, {}),
      );
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setSaving(false);
    }
  }

  async function refreshDashboard() {
    const dashboard = await getAdminDashboard();
    setSummary(dashboard.summary);
  }

  function beginEdit(user: ManagedUser) {
    const customFields = profileFields.map((field) => {
      const savedField = (user.customFields ?? []).find(
        (customField) => customField.fieldId === field.id,
      );
      return {
        fieldId: field.id,
        value: savedField?.value ?? "",
      };
    });

    setEditingUserId(user.id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      customFields,
      isActive: user.isActive,
    });
  }

  async function addProfileField() {
    if (!routeState.role || !newFieldLabel.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const field = await createProfileField(routeState.role, {
        label: newFieldLabel,
        editableByUser: newFieldEditableByUser,
      });
      setProfileFields((current) => [...current, field]);
      setCustomFieldValues((current) => ({ ...current, [field.id]: "" }));
      setNewFieldLabel("");
      setNewFieldEditableByUser(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add profile field");
    } finally {
      setSaving(false);
    }
  }

  function beginEditProfileField(field: ProfileFieldDefinition) {
    setEditingFieldId(field.id);
    setEditingFieldLabel(field.label);
    setEditingFieldEditableByUser(field.editableByUser);
  }

  function cancelEditProfileField() {
    setEditingFieldId(null);
    setEditingFieldLabel("");
    setEditingFieldEditableByUser(true);
  }

  async function saveProfileField(fieldId: string) {
    if (!routeState.role || !editingFieldLabel.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await updateProfileField(routeState.role, fieldId, {
        label: editingFieldLabel,
        editableByUser: editingFieldEditableByUser,
      });
      setProfileFields((current) =>
        current.map((field) => (field.id === updated.id ? updated : field)),
      );
      setUsers((current) =>
        current.map((user) =>
          user.role === routeState.role
            ? {
                ...user,
                customFields: (user.customFields ?? []).map((field) =>
                  field.fieldId === updated.id
                    ? {
                        ...field,
                        label: updated.label,
                        editableByUser: updated.editableByUser,
                      }
                    : field,
                ),
              }
            : user,
        ),
      );
      setCreatedAccount((current) =>
        current?.role === routeState.role
          ? {
              ...current,
              customFields: (current.customFields ?? []).map((field) =>
                field.fieldId === updated.id
                  ? {
                      ...field,
                      label: updated.label,
                      editableByUser: updated.editableByUser,
                    }
                  : field,
              ),
            }
          : current,
      );
      cancelEditProfileField();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile field");
    } finally {
      setSaving(false);
    }
  }

  async function removeProfileField(field: ProfileFieldDefinition) {
    if (!routeState.role) return;

    const confirmed = window.confirm(
      `Delete "${field.label}" from ${routeState.role} profile fields? This removes it from existing ${routeState.role} accounts too.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await deleteProfileField(routeState.role, field.id);
      setProfileFields((current) => current.filter((item) => item.id !== field.id));
      setCustomFieldValues((current) => {
        const next = { ...current };
        delete next[field.id];
        return next;
      });
      setUsers((current) =>
        current.map((user) =>
          user.role === routeState.role
            ? {
                ...user,
                customFields: (user.customFields ?? []).filter(
                  (customField) => customField.fieldId !== field.id,
                ),
              }
            : user,
        ),
      );
      setCreatedAccount((current) =>
        current?.role === routeState.role
          ? {
              ...current,
              customFields: (current.customFields ?? []).filter(
                (customField) => customField.fieldId !== field.id,
              ),
            }
          : current,
      );
      if (editingFieldId === field.id) cancelEditProfileField();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete profile field");
    } finally {
      setSaving(false);
    }
  }

  async function saveUser(userId: string) {
    if (!editForm) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await updateManagedUser(userId, editForm);
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );
      setCreatedAccount((current) => (current?.id === updated.id ? updated : current));
      setEditingUserId(null);
      setEditForm(null);
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user: ManagedUser) {
    const confirmed = window.confirm(
      `Delete ${user.name}'s account? This removes the login from RehabAssist.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    const isCreatedAccount = createdAccount?.id === user.id;

    try {
      await deleteManagedUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setCreatedAccount((current) => (current?.id === user.id ? null : current));
      if (isCreatedAccount) setCreatedCredentials(null);
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user");
    } finally {
      setSaving(false);
    }
  }

  async function saveCenterProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!centerForm) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await updateRehabCenterProfile(centerForm);
      setCenterProfile(updated);
      setCenterForm({
        name: updated.name,
        email: updated.email,
        registrationNo: updated.registrationNo,
        phone: updated.phone,
        address: updated.address,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update center profile");
    } finally {
      setSaving(false);
    }
  }

  async function copyCredentials() {
    if (!createdCredentials) return;
    await navigator.clipboard.writeText(
      `Username: ${createdCredentials.username}\nTemporary password: ${createdCredentials.temporaryPassword}`,
    );
  }

  if (routeState.mode === "center-profile") {
    return (
      <AdminShell title="Center Profile" description="Edit rehab center identity and contact details.">
        {error && <ErrorBanner message={error} />}
        <Card className="max-w-3xl rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>{centerProfile?.name ?? "Rehab center"}</CardTitle>
            <CardDescription>
              Code: <span className="font-mono">{centerProfile?.code ?? "rcc"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {centerForm && (
              <form className="grid gap-4" onSubmit={saveCenterProfile}>
                <Field label="Center name" value={centerForm.name} onChange={(value) => setCenterForm((current) => current && { ...current, name: value })} required />
                <Field label="Email" type="email" value={centerForm.email} onChange={(value) => setCenterForm((current) => current && { ...current, email: value })} />
                <Field label="Registration no." value={centerForm.registrationNo} onChange={(value) => setCenterForm((current) => current && { ...current, registrationNo: value })} />
                <Field label="Phone" value={centerForm.phone} onChange={(value) => setCenterForm((current) => current && { ...current, phone: value })} />
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={centerForm.address}
                    onChange={(event) =>
                      setCenterForm((current) =>
                        current ? { ...current, address: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <Button type="submit" className="w-fit" disabled={saving}>
                  <Save className="size-4" />
                  Save profile
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </AdminShell>
    );
  }

  if (routeState.mode === "dashboard") {
    return (
      <AdminShell title="Admin Dashboard" description="Operational overview for RehabCare Colombo.">
        {error && <ErrorBanner message={error} />}
        <DashboardHero
          activePatients={summary?.activePatients ?? 0}
          activeTherapists={summary?.activeTherapists ?? 0}
          pendingLogins={(summary?.pendingPatients ?? 0) + (summary?.pendingTherapists ?? 0)}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Active Patients" value={summary?.activePatients ?? 0} tone="teal" />
          <MetricCard label="Active Therapists" value={summary?.activeTherapists ?? 0} tone="blue" />
          <MetricCard label="Patients Pending Login" value={summary?.pendingPatients ?? 0} tone="mint" />
          <MetricCard label="Therapists Pending Login" value={summary?.pendingTherapists ?? 0} tone="soft" />
          <MetricCard label="Inactive Accounts" value={summary?.inactiveAccounts ?? 0} tone="neutral" />
        </div>

      </AdminShell>
    );
  }

  const roleLabel = routeState.role === "therapist" ? "Therapist" : "Patient";

  if (routeState.mode === "register") {
    return (
      <AdminShell title={`Register ${roleLabel}`} description={`Create a ${roleLabel.toLowerCase()} account.`}>
        {error && <ErrorBanner message={error} />}
        <RoleSectionNav role={routeState.role ?? "patient"} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,620px)_minmax(360px,1fr)] xl:items-start">
          <RegisterCard
            roleLabel={roleLabel}
            form={form}
            profileFields={profileFields}
            customFieldValues={customFieldValues}
            newFieldLabel={newFieldLabel}
            newFieldEditableByUser={newFieldEditableByUser}
            editingFieldId={editingFieldId}
            editingFieldLabel={editingFieldLabel}
            editingFieldEditableByUser={editingFieldEditableByUser}
            saving={saving}
            onChange={setForm}
            onCustomFieldValueChange={(fieldId, value) =>
              setCustomFieldValues((current) => ({ ...current, [fieldId]: value }))
            }
            onNewFieldLabelChange={setNewFieldLabel}
            onNewFieldEditableByUserChange={setNewFieldEditableByUser}
            onEditingFieldLabelChange={setEditingFieldLabel}
            onEditingFieldEditableByUserChange={setEditingFieldEditableByUser}
            onAddProfileField={addProfileField}
            onBeginEditProfileField={beginEditProfileField}
            onCancelEditProfileField={cancelEditProfileField}
            onSaveProfileField={saveProfileField}
            onDeleteProfileField={removeProfileField}
            onSubmit={handleCreateUser}
          />
          {createdAccount && createdCredentials && (
            <CreatedAccountCard
              account={createdAccount}
              credentials={createdCredentials}
              roleLabel={roleLabel}
              onCopy={copyCredentials}
              onBeginEdit={() => beginEdit(createdAccount)}
              onDelete={() => removeUser(createdAccount)}
            />
          )}
        </div>
        <EditUserDialog
          open={Boolean(editingUserId && editForm)}
          editForm={editForm}
          profileFields={profileFields}
          saving={saving}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUserId(null);
              setEditForm(null);
            }
          }}
          onEditFormChange={setEditForm}
          onSave={() => {
            if (editingUserId) void saveUser(editingUserId);
          }}
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={`${roleLabel} List`}
      description={`Search and manage all registered ${roleLabel.toLowerCase()} accounts.`}
    >
      {error && <ErrorBanner message={error} />}
      <RoleSectionNav role={routeState.role ?? "patient"} />
      <UserListCard
        title={`${roleLabel} Accounts`}
        description="Open a profile card to update details or remove an account."
        users={visibleUsers}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        profileFields={profileFields}
        editingUserId={editingUserId}
        editForm={editForm}
        saving={saving}
        onBeginEdit={beginEdit}
        onCancelEdit={() => {
          setEditingUserId(null);
          setEditForm(null);
        }}
        onEditFormChange={setEditForm}
        onSave={saveUser}
        onDelete={removeUser}
      />
    </AdminShell>
  );
}

function getRouteState(pathname: string): { mode: PageMode; role: RoleScope | null } {
  if (pathname.includes("/profile")) return { mode: "center-profile", role: null };
  if (pathname.includes("/patients/register")) return { mode: "register", role: "patient" };
  if (pathname.includes("/patients")) return { mode: "list", role: "patient" };
  if (pathname.includes("/therapists/register")) return { mode: "register", role: "therapist" };
  if (pathname.includes("/therapists")) return { mode: "list", role: "therapist" };
  return { mode: "dashboard", role: null };
}

function AdminShell({
  title,
  // description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-animate-in mx-auto flex w-full max-w-7xl flex-col gap-5 pt-5">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-[#0b7f92]">RehabCare Colombo</p>
          <h2 className="text-3xl font-semibold tracking-normal text-[#1e3445]">{title}</h2>
          {/* <p className="text-sm text-[#587184]">{description}</p> */}
        </div>
      </div>
      {children}
    </div>
  );
}

function RoleSectionNav({ role }: { role: RoleScope }) {
  const label = role === "therapist" ? "Therapist" : "Patient";
  const plural = role === "therapist" ? "Therapists" : "Patients";
  const basePath = role === "therapist" ? "/admin/therapists" : "/admin/patients";
  const { pathname } = useLocation();
  const linkClass = (target: string) =>
    pathname === target
      ? "bg-[#0b7f92] text-white hover:bg-[#096b7a] hover:text-white [&_a]:text-white"
      : "";

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-[#d9e8ed] bg-white/70 p-2 shadow-sm shadow-slate-200/60 backdrop-blur">
      <Button asChild variant="outline" size="sm" className={linkClass(`${basePath}/register`)}>
        <Link to={`${basePath}/register`}>Register {label}</Link>
      </Button>
      <Button asChild variant="outline" size="sm" className={linkClass(`${basePath}/list`)}>
        <Link to={`${basePath}/list`}>{plural} List</Link>
      </Button>
    </div>
  );
}

function RegisterCard({
  roleLabel,
  form,
  profileFields,
  customFieldValues,
  newFieldLabel,
  newFieldEditableByUser,
  editingFieldId,
  editingFieldLabel,
  editingFieldEditableByUser,
  saving,
  onChange,
  onCustomFieldValueChange,
  onNewFieldLabelChange,
  onNewFieldEditableByUserChange,
  onEditingFieldLabelChange,
  onEditingFieldEditableByUserChange,
  onAddProfileField,
  onBeginEditProfileField,
  onCancelEditProfileField,
  onSaveProfileField,
  onDeleteProfileField,
  onSubmit,
}: {
  roleLabel: string;
  form: CreateManagedUserInput;
  profileFields: ProfileFieldDefinition[];
  customFieldValues: Record<string, string>;
  newFieldLabel: string;
  newFieldEditableByUser: boolean;
  editingFieldId: string | null;
  editingFieldLabel: string;
  editingFieldEditableByUser: boolean;
  saving: boolean;
  onChange: (value: CreateManagedUserInput) => void;
  onCustomFieldValueChange: (fieldId: string, value: string) => void;
  onNewFieldLabelChange: (value: string) => void;
  onNewFieldEditableByUserChange: (value: boolean) => void;
  onEditingFieldLabelChange: (value: string) => void;
  onEditingFieldEditableByUserChange: (value: boolean) => void;
  onAddProfileField: () => void;
  onBeginEditProfileField: (field: ProfileFieldDefinition) => void;
  onCancelEditProfileField: () => void;
  onSaveProfileField: (fieldId: string) => void;
  onDeleteProfileField: (field: ProfileFieldDefinition) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="rounded-lg border-0 bg-white/85 shadow-sm shadow-slate-200/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRoundPlus className="size-4" />
          Create {roleLabel}
        </CardTitle>
        <CardDescription>
          Username is generated automatically using the center code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label="First name" value={form.firstName} onChange={(value) => onChange({ ...form, firstName: value })} required />
          <Field label="Last name" value={form.lastName} onChange={(value) => onChange({ ...form, lastName: value })} />
          <Field label="Email" type="email" value={form.email} onChange={(value) => onChange({ ...form, email: value })} required />
          <Field label="Phone" value={form.phone} onChange={(value) => onChange({ ...form, phone: value })} required />
          <CustomFieldsEditor
            roleLabel={roleLabel}
            profileFields={profileFields}
            customFieldValues={customFieldValues}
            newFieldLabel={newFieldLabel}
            newFieldEditableByUser={newFieldEditableByUser}
            editingFieldId={editingFieldId}
            editingFieldLabel={editingFieldLabel}
            editingFieldEditableByUser={editingFieldEditableByUser}
            saving={saving}
            onCustomFieldValueChange={onCustomFieldValueChange}
            onNewFieldLabelChange={onNewFieldLabelChange}
            onNewFieldEditableByUserChange={onNewFieldEditableByUserChange}
            onEditingFieldLabelChange={onEditingFieldLabelChange}
            onEditingFieldEditableByUserChange={onEditingFieldEditableByUserChange}
            onAddProfileField={onAddProfileField}
            onBeginEditProfileField={onBeginEditProfileField}
            onCancelEditProfileField={onCancelEditProfileField}
            onSaveProfileField={onSaveProfileField}
            onDeleteProfileField={onDeleteProfileField}
          />
          <Button type="submit" disabled={saving}>
            <Plus className="size-4" />
            {saving ? "Creating..." : `Create ${roleLabel.toLowerCase()}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CustomFieldsEditor({
  roleLabel,
  profileFields,
  customFieldValues,
  newFieldLabel,
  newFieldEditableByUser,
  editingFieldId,
  editingFieldLabel,
  editingFieldEditableByUser,
  saving,
  onCustomFieldValueChange,
  onNewFieldLabelChange,
  onNewFieldEditableByUserChange,
  onEditingFieldLabelChange,
  onEditingFieldEditableByUserChange,
  onAddProfileField,
  onBeginEditProfileField,
  onCancelEditProfileField,
  onSaveProfileField,
  onDeleteProfileField,
}: {
  roleLabel: string;
  profileFields: ProfileFieldDefinition[];
  customFieldValues: Record<string, string>;
  newFieldLabel: string;
  newFieldEditableByUser: boolean;
  editingFieldId: string | null;
  editingFieldLabel: string;
  editingFieldEditableByUser: boolean;
  saving: boolean;
  onCustomFieldValueChange: (fieldId: string, value: string) => void;
  onNewFieldLabelChange: (value: string) => void;
  onNewFieldEditableByUserChange: (value: boolean) => void;
  onEditingFieldLabelChange: (value: string) => void;
  onEditingFieldEditableByUserChange: (value: boolean) => void;
  onAddProfileField: () => void;
  onBeginEditProfileField: (field: ProfileFieldDefinition) => void;
  onCancelEditProfileField: () => void;
  onSaveProfileField: (fieldId: string) => void;
  onDeleteProfileField: (field: ProfileFieldDefinition) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-[#d9e8ed] bg-[#f7fbfd] p-3">
      <div>
        <p className="text-sm font-semibold text-[#1e3445]">Additional {roleLabel.toLowerCase()} fields</p>
        <p className="text-xs text-[#587184]">
          Saved fields will appear for future {roleLabel.toLowerCase()} registrations and profiles.
        </p>
      </div>

      {profileFields.length > 0 && (
        <div className="grid gap-3">
          {profileFields.map((field) => {
            const isEditing = editingFieldId === field.id;

            return (
              <div key={field.id} className="grid gap-2 rounded-md border border-[#d9e8ed] bg-white/70 p-3">
                {isEditing ? (
                  <div className="grid gap-2">
                    <Label htmlFor={`edit-field-${field.id}`}>Field name</Label>
                    <Input
                      id={`edit-field-${field.id}`}
                      value={editingFieldLabel}
                      onChange={(event) => onEditingFieldLabelChange(event.target.value)}
                    />
                    <label className="flex items-center gap-2 text-xs text-[#587184]">
                      <input
                        type="checkbox"
                        checked={editingFieldEditableByUser}
                        onChange={(event) =>
                          onEditingFieldEditableByUserChange(event.target.checked)
                        }
                      />
                      User can edit this field from their profile
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#0b7f92] text-white hover:bg-[#096b7a]"
                        disabled={saving || !editingFieldLabel.trim()}
                        onClick={() => onSaveProfileField(field.id)}
                      >
                        <Save className="size-4" />
                        Save field
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onCancelEditProfileField}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Label htmlFor={`custom-${field.id}`}>{field.label}</Label>
                        <div className="mt-1">
                          <Badge variant={field.editableByUser ? "secondary" : "outline"}>
                            {field.editableByUser ? "User editable" : "View only"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => onBeginEditProfileField(field)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                          onClick={() => onDeleteProfileField(field)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      id={`custom-${field.id}`}
                      value={customFieldValues[field.id] ?? ""}
                      onChange={(event) => onCustomFieldValueChange(field.id, event.target.value)}
                      placeholder="Leave empty if details are not available"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-2 rounded-md border border-dashed border-[#a9cdd5] bg-white/80 p-3">
        <Label htmlFor="new-profile-field">Add reusable field</Label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            id="new-profile-field"
            value={newFieldLabel}
            onChange={(event) => onNewFieldLabelChange(event.target.value)}
            placeholder="Example: Age, injury type, license number"
          />
          <Button
            type="button"
            variant="outline"
            disabled={saving || !newFieldLabel.trim()}
            onClick={onAddProfileField}
          >
            <Plus className="size-4" />
            Add field
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#587184]">
          <input
            type="checkbox"
            checked={newFieldEditableByUser}
            onChange={(event) => onNewFieldEditableByUserChange(event.target.checked)}
          />
          User can edit this field from their profile
        </label>
      </div>
    </div>
  );
}

function UserListCard({
  title,
  description,
  users,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  profileFields,
  editingUserId,
  editForm,
  saving,
  onBeginEdit,
  onCancelEdit,
  onEditFormChange,
  onSave,
  onDelete,
}: {
  title: string;
  description: string;
  users: ManagedUser[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  profileFields: ProfileFieldDefinition[];
  editingUserId: string | null;
  editForm: UpdateManagedUserInput | null;
  saving: boolean;
  onBeginEdit: (user: ManagedUser) => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: UpdateManagedUserInput | null) => void;
  onSave: (userId: string) => void;
  onDelete: (user: ManagedUser) => void;
}) {
  return (
    <Card className="rounded-lg border-0 bg-white/85 shadow-sm shadow-slate-200/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#587184]" />
            <Input
              className="bg-white pl-9"
              placeholder="Search by name, code, email, or phone"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["pending", "Pending"],
              ["inactive", "Inactive"],
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                className={
                  statusFilter === value
                    ? "bg-[#0b7f92] text-white hover:bg-[#096b7a] hover:text-white"
                    : ""
                }
                onClick={() => onStatusFilterChange(value as StatusFilter)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          {users.map((user) => (
            <UserProfileCard
              key={user.id}
              user={user}
              onBeginEdit={() => onBeginEdit(user)}
              onDelete={() => onDelete(user)}
            />
          ))}
          {!users.length && (
            <div className="rounded-lg border border-dashed border-[#a9cdd5] bg-[#f7fbfd] p-8 text-center text-sm text-[#587184]">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[#e4f7f4] text-[#0b7f92]">
                <Users className="size-5" />
              </div>
              No accounts found for this section.
            </div>
          )}
        </div>
        <EditUserDialog
          open={Boolean(editingUserId && editForm)}
          editForm={editForm}
          profileFields={profileFields}
          saving={saving}
          onOpenChange={(open) => {
            if (!open) onCancelEdit();
          }}
          onEditFormChange={onEditFormChange}
          onSave={() => {
            if (editingUserId) onSave(editingUserId);
          }}
        />
      </CardContent>
    </Card>
  );
}

function UserProfileCard({
  user,
  onBeginEdit,
  onDelete,
}: {
  user: ManagedUser;
  onBeginEdit: () => void;
  onDelete: () => void;
}) {
  const initials =
    user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="rounded-lg border border-[#d9e8ed] bg-white/75 p-4 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e4f7f4] text-sm font-semibold text-[#0b7f92]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{user.name}</h3>
              <Badge variant={user.role === "patient" ? "secondary" : "outline"}>
                {user.role}
              </Badge>
              <Badge variant={user.firstLogin ? "outline" : "secondary"}>
                {user.firstLogin ? "Pending login" : "Active"}
              </Badge>
              {!user.isActive && <Badge variant="destructive">Inactive</Badge>}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{user.username}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.email || user.phone || "Profile details pending"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBeginEdit}>
            <Pencil className="size-4" />
            Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditUserDialog({
  open,
  editForm,
  profileFields,
  saving,
  onOpenChange,
  onEditFormChange,
  onSave,
}: {
  open: boolean;
  editForm: UpdateManagedUserInput | null;
  profileFields: ProfileFieldDefinition[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onEditFormChange: (form: UpdateManagedUserInput | null) => void;
  onSave: () => void;
}) {
  if (!editForm) return null;

  const setCustomFieldValue = (fieldId: string, value: string) => {
    const nextFields = profileFields.map((field) => {
      const existing = editForm.customFields?.find((customField) => customField.fieldId === field.id);
      return {
        fieldId: field.id,
        value: field.id === fieldId ? value : existing?.value ?? "",
      };
    });

    onEditFormChange({ ...editForm, customFields: nextFields });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-white shadow-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update contact details and account status.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First name" value={editForm.firstName} onChange={(value) => onEditFormChange({ ...editForm, firstName: value })} required />
          <Field label="Last name" value={editForm.lastName} onChange={(value) => onEditFormChange({ ...editForm, lastName: value })} />
          <Field label="Email" type="email" value={editForm.email} onChange={(value) => onEditFormChange({ ...editForm, email: value })} required />
          <Field label="Phone" value={editForm.phone} onChange={(value) => onEditFormChange({ ...editForm, phone: value })} required />
        </div>
        {profileFields.length > 0 && (
          <div className="grid gap-3 rounded-lg border border-[#d9e8ed] bg-[#f7fbfd] p-3">
            <div>
              <p className="text-sm font-semibold text-[#1e3445]">Additional profile fields</p>
              <p className="text-xs text-[#587184]">
                Users can edit only the fields marked user editable.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {profileFields.map((field) => {
                const value =
                  editForm.customFields?.find((customField) => customField.fieldId === field.id)
                    ?.value ?? "";

                return (
                  <div key={field.id} className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`edit-custom-${field.id}`}>{field.label}</Label>
                      <Badge variant={field.editableByUser ? "secondary" : "outline"}>
                        {field.editableByUser ? "User editable" : "View only"}
                      </Badge>
                    </div>
                    <Input
                      id={`edit-custom-${field.id}`}
                      value={value}
                      onChange={(event) => setCustomFieldValue(field.id, event.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editForm.isActive}
            onChange={(event) =>
              onEditFormChange({ ...editForm, isActive: event.target.checked })
            }
          />
          Account active
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            <Save className="size-4" />
            Save details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatedAccountCard({
  account,
  credentials,
  roleLabel,
  onCopy,
  onBeginEdit,
  onDelete,
}: {
  account: ManagedUser;
  credentials: { username: string; temporaryPassword: string; email: string };
  roleLabel: string;
  onCopy: () => void;
  onBeginEdit: () => void;
  onDelete: () => void;
}) {
  const mailSubject = encodeURIComponent("Your RehabAssist login credentials");
  const mailBody = encodeURIComponent(
    `Hello,\n\nYour RehabAssist ${roleLabel.toLowerCase()} account has been created.\n\nUsername: ${credentials.username}\nTemporary password: ${credentials.temporaryPassword}\n\nPlease login and reset your password after your first login.\n\nRehabCare Colombo`,
  );
  const mailTo = credentials.email
    ? `mailto:${credentials.email}?subject=${mailSubject}&body=${mailBody}`
    : "";

  return (
    <Card className="rounded-lg border-0 bg-white/85 shadow-sm shadow-slate-200/70 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Registered account</CardTitle>
            <CardDescription>
              This is the account created just now.
            </CardDescription>
          </div>
          <Badge className="bg-[#0b7f92] text-white hover:bg-[#0b7f92]">
            Success
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border border-[#b9ded8] bg-[#e9fbf3] px-3 py-2 text-sm font-medium text-[#0b7f92]">
          {roleLabel} account created successfully.
        </div>
        <div className="rounded-lg border border-[#d9e8ed] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e4f7f4] text-sm font-semibold text-[#0b7f92]">
                {getInitials(account.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-[#1e3445]">{account.name}</h3>
                  <Badge variant="secondary">{account.role}</Badge>
                  <Badge variant="outline">Pending login</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-[#587184]">{account.username}</p>
                <p className="mt-1 text-sm text-[#587184]">
                  {account.email} {account.phone ? `- ${account.phone}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onBeginEdit}>
                <Pencil className="size-4" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">Username:</span>{" "}
            <span className="font-mono">{credentials.username}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Temporary password:</span>{" "}
            <span className="font-mono">{credentials.temporaryPassword}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="w-fit" onClick={onCopy}>
            <Copy className="size-4" />
            Copy credentials
          </Button>
          {mailTo && (
            <Button asChild className="w-fit bg-[#0b7f92] text-white hover:bg-[#096b7a]">
              <a href={mailTo}>
                <Mail className="size-4" />
                Send login email
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function DashboardHero({
  activePatients,
  activeTherapists,
  pendingLogins,
}: {
  activePatients: number;
  activeTherapists: number;
  pendingLogins: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-[#cde7ec] bg-gradient-to-br from-white via-[#f1fbfb] to-[#dff4f1] p-5 shadow-sm shadow-slate-200/80">
      <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#0b7f92] shadow-sm">
            <Activity className="size-3.5" />
            Rehab center operations
          </div>
          <h2 className="max-w-2xl text-2xl font-semibold text-[#1e3445]">
            Manage patients and therapists from one clean workspace.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#587184]">
            Register accounts, and keep the center profile ready for clinical workflows.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="bg-[#0b7f92] text-white shadow-sm shadow-teal-900/20 hover:bg-[#096b7a] hover:text-white [&_a]:text-white">
              <Link to="/admin/patients/register">Register patient</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/therapists/register">Register therapist</Link>
            </Button>
          </div>
        </div>

        <div className="admin-float hidden rounded-lg border border-white/80 bg-white/75 p-4 shadow-lg shadow-teal-900/10 backdrop-blur lg:block">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#0b7f92]">Today</p>
              <p className="text-sm font-semibold text-[#1e3445]">Account readiness</p>
            </div>
            <Waves className="size-5 text-[#37b7a5]" />
          </div>
          <div className="grid gap-2">
            <IllustrationRow label="Active patients" value={activePatients} tone="teal" />
            <IllustrationRow label="Active therapists" value={activeTherapists} tone="blue" />
            <IllustrationRow label="Pending user login" value={pendingLogins} tone="mint" />
          </div>
        </div>
      </div>
    </section>
  );
}

function IllustrationRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "teal" | "blue" | "mint";
}) {
  const maxUsers = 100;
  const width = `${Math.min(100, Math.max(0, (value / maxUsers) * 100))}%`;
  const barClass = {
    teal: "from-[#0b7f92] to-[#37b7a5]",
    blue: "from-[#3468c9] to-[#71a7f3]",
    mint: "from-[#239980] to-[#89d8d0]",
  }[tone];

  return (
    <div className="rounded-md bg-[#f4fbfc] p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-[#587184]">{label}</span>
        <span className="font-semibold text-[#1e3445]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#d9e8ed]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all duration-500`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "teal" | "blue" | "mint" | "soft" | "neutral";
}) {
  const toneClass = {
    teal: "from-[#e5f8f6] to-white text-[#0b7f92]",
    blue: "from-[#eaf2ff] to-white text-[#3468c9]",
    mint: "from-[#e9fbf3] to-white text-[#239980]",
    soft: "from-[#edf7fb] to-white text-[#0c6170]",
    neutral: "from-[#f4f7f8] to-white text-[#587184]",
  }[tone];

  return (
    <Card className={`rounded-lg border-0 bg-gradient-to-br ${toneClass} shadow-sm shadow-slate-200/70 transition duration-200 hover:-translate-y-0.5`}>
      <CardContent className="p-4">
        <p className="text-sm text-[#587184]">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}
