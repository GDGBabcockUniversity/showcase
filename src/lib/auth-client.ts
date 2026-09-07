import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// inferAdditionalFields carries department/level from the server config into the
// client's types — the import is type-only, so no server code ships to the browser.
export const { signIn, signUp, signOut, useSession } = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
