"use client";

import { useSession } from "@/lib/auth-client";

// Lives here rather than in auth-modal so a button can trigger the modal
// without pulling the whole dialog into its bundle.
export const OPEN_AUTH_MODAL_EVENT = "open-auth-modal";

export function openAuthModal() {
  window.dispatchEvent(new Event(OPEN_AUTH_MODAL_EVENT));
}

// Guard for actions that need a session. Call it first: when nobody is signed
// in it opens the modal on the spot and returns false, so the click never makes
// a round trip only to be bounced to the home page.
//
// The matching server-side check stays where it is — this is about not wasting
// the trip, not about security.
export function useRequireAuth() {
  const { data: session, isPending } = useSession();

  return () => {
    // Session still resolving: let it through rather than flash the modal at
    // someone who is in fact signed in. The action redirects if they aren't.
    if (isPending || session) return true;
    openAuthModal();
    return false;
  };
}
