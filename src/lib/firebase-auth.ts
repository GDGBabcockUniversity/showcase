"use client";

import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  inMemoryPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";

let ready: ReturnType<typeof initializeAuth> | undefined;
let resolved: Auth | undefined;
async function initializeAuth() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.appId
  )
    throw new Error("Firebase sign-in is not configured");
  const app =
    getApps().find((app) => app.name === "showcase-auth") ??
    initializeApp(config, "showcase-auth");
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence);
  return auth;
}

export function firebaseAuth() {
  ready ??= initializeAuth()
    .then((auth) => (resolved = auth))
    .catch((error) => {
      ready = undefined;
      throw error;
    });
  return ready;
}

// Synchronous access once firebaseAuth() has resolved, so popup sign-in can
// run inside the click gesture without awaiting first.
export function firebaseAuthIfReady() {
  return resolved;
}
