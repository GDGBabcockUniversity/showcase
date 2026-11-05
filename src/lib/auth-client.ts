"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseAuth, firebaseAuthIfReady } from "@/lib/firebase-auth";
import type { Session } from "@/lib/auth";

// One shared session snapshot for every component, fed by /api/auth/session.
type State = { data: Session | null; isPending: boolean };
let state: State = { data: null, isPending: true };
let started = false;
const listeners = new Set<() => void>();
const emit = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};

async function refetch() {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    emit({ data: res.ok ? await res.json() : null, isPending: false });
  } catch {
    emit({ data: null, isPending: false });
  }
}

export function useSession() {
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (started) return;
    started = true;
    refetch();
  }, []);
  return { ...snapshot, refetch };
}

// Firebase only proves who they are; the GDG auth service issues the session.
async function exchange(login: () => Promise<User>) {
  try {
    const user = await login();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebase_token: await user.getIdToken(true) }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Sign-in failed");
    emit({ data: body, isPending: false });
  } finally {
    const auth = await firebaseAuth().catch(() => null);
    if (auth) await firebaseSignOut(auth);
  }
}

export const signIn = {
  email: (email: string, password: string) =>
    exchange(async () => (await signInWithEmailAndPassword(await firebaseAuth(), email, password)).user),
  // Uses the already-initialised instance when it can, so the popup opens
  // inside the click gesture instead of after an await (popup blockers).
  google: () =>
    exchange(
      async () =>
        (await signInWithPopup(firebaseAuthIfReady() ?? (await firebaseAuth()), new GoogleAuthProvider())).user,
    ),
};

export const signUp = {
  email: (name: string, email: string, password: string) =>
    exchange(async () => {
      const { user } = await createUserWithEmailAndPassword(await firebaseAuth(), email, password);
      await updateProfile(user, { displayName: name.trim() });
      return user;
    }),
};

export async function signOut() {
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
  emit({ data: null, isPending: false });
}

// Warm Firebase up before the modal's Google button is clicked.
export const warmUpFirebase = () => firebaseAuth().catch(() => {});
