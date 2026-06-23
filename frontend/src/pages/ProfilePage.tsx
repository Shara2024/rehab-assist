import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Save, UserRound } from "lucide-react";

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
import { useAuth } from "@/contexts/AuthContext";
import { authActions } from "@/contexts/auth-context/authAction";
import type { AuthUser } from "@/contexts/auth-context/authTypes";
import { getOwnProfile, updateOwnProfile } from "@/services/ProfileService";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customFields: Record<string, string>;
};

export default function ProfilePage() {
  const { state, dispatch } = useAuth();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = state.user;

  useEffect(() => {
    if (!user) return;

    setForm(toForm(user));
    void refreshProfile(user.id);
  }, [user?.id]);

  async function refreshProfile(id: string) {
    try {
      const profile = await getOwnProfile(id);
      if (state.token) dispatch(authActions.restore(profile, state.token));
      setForm(toForm(profile));
    } catch {
      // Keep the restored local profile if the backend is temporarily offline.
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !form) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const updated = await updateOwnProfile(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        customFields: (user.customFields ?? []).map((field) => ({
          fieldId: field.fieldId,
          value: form.customFields[field.fieldId] ?? "",
        })),
      });
      if (state.token) dispatch(authActions.restore(updated, state.token));
      setForm(toForm(updated));
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user || !form) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pt-5">
      <div>
        <p className="text-sm font-semibold text-[#0b7f92]">{user.rehabCenterName ?? "RehabAssist"}</p>
        <h2 className="text-3xl font-semibold tracking-normal text-[#1e3445]">Profile</h2>
      </div>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-md border border-[#b9ded8] bg-[#e9fbf3] px-3 py-2 text-sm text-[#0b7f92]">{message}</div>}

      <Card className="rounded-lg border-0 bg-white/85 shadow-sm shadow-slate-200/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4" />
            Account details
          </CardTitle>
          <CardDescription>
            Keep your contact details and assigned profile information up to date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={saveProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileField label="First name" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} required />
              <ProfileField label="Last name" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} />
              <ProfileField label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
              <ProfileField label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required />
            </div>

            {(user.customFields ?? []).length > 0 && (
              <div className="grid gap-3 rounded-lg border border-[#d9e8ed] bg-[#f7fbfd] p-3">
                <p className="text-sm font-semibold text-[#1e3445]">Additional details</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(user.customFields ?? []).map((field) => (
                    <div key={field.fieldId} className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor={`profile-${field.fieldId}`}>{field.label}</Label>
                        <Badge variant={field.editableByUser ? "secondary" : "outline"}>
                          {field.editableByUser ? "Editable" : "View only"}
                        </Badge>
                      </div>
                      <Input
                        id={`profile-${field.fieldId}`}
                        value={form.customFields[field.fieldId] ?? ""}
                        disabled={!field.editableByUser}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            customFields: {
                              ...form.customFields,
                              [field.fieldId]: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-fit bg-[#0b7f92] text-white hover:bg-[#096b7a]" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function toForm(user: AuthUser): ProfileForm {
  const [fallbackFirstName = "", ...rest] = user.name.split(" ");

  return {
    firstName: user.firstName ?? fallbackFirstName,
    lastName: user.lastName ?? rest.join(" "),
    email: user.email ?? "",
    phone: user.phone ?? "",
    customFields: (user.customFields ?? []).reduce<Record<string, string>>((fields, field) => {
      fields[field.fieldId] = field.value ?? "";
      return fields;
    }, {}),
  };
}

function ProfileField({
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
