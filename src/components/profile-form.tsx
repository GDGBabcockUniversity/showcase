"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateProfile, type ProfileState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DEPARTMENTS, LEVELS } from "@/lib/departments";
import { BIO_MAX } from "@/lib/limits";
import { USERNAME_MAX, USERNAME_MIN } from "@/lib/username";
import { useSession } from "@/lib/auth-client";

// The two selects stay native — `inputClass` keeps them looking like the
// Input component.
const inputClass =
  "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue";

const initial: ProfileState = { ok: false };

export function ProfileForm({
  name: initialName,
  username: initialUsername,
  bio: initialBio,
  email,
  department: initialDepartment,
  level: initialLevel,
}: {
  name: string;
  username: string;
  bio: string;
  email: string;
  department: string | null;
  level: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);
  const { refetch } = useSession();

  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [department, setDepartment] = useState(initialDepartment ?? "");
  const [level, setLevel] = useState(initialLevel ?? "");

  useEffect(() => {
    if (state.ok) {
      refetch();
      toast.success("Profile saved.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, refetch]);

  const dirty =
    name !== initialName ||
    username !== initialUsername ||
    bio !== initialBio ||
    department !== (initialDepartment ?? "") ||
    level !== (initialLevel ?? "");

  return (
    <form action={formAction} className="mt-4 grid gap-5 sm:grid-cols-2">
      <div>
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="profile-username">Username</Label>
        <Input
          id="profile-username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={USERNAME_MIN}
          maxLength={USERNAME_MAX}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          value={email}
          readOnly
          aria-readonly
          className="mt-2 cursor-not-allowed opacity-60"
        />
      </div>

      <div>
        <Label htmlFor="profile-department">Department</Label>
        <select
          id="profile-department"
          name="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={`mt-2 ${inputClass}`}
        >
          <option value="">Not set</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="profile-level">Level</Label>
        <select
          id="profile-level"
          name="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={`mt-2 ${inputClass}`}
        >
          <option value="">Not set</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <span className="flex items-baseline justify-between gap-2">
          <Label htmlFor="profile-bio">Bio</Label>
          <span
            className={`font-mono text-[10px] tabular-nums ${
              bio.length > BIO_MAX ? "text-red" : "text-muted"
            }`}
          >
            {bio.length}/{BIO_MAX}
          </span>
        </span>
        <Textarea
          id="profile-bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={3}
          placeholder="A line about what you build."
          className="mt-2"
        />
      </div>

      <div className="flex items-center justify-between gap-4 sm:col-span-2">
        <p aria-live="polite" className="font-mono text-[11px]">
          <span className="text-muted">Your email can&apos;t be changed here.</span>
        </p>
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
