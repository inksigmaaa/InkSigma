import { createAuthClient } from "better-auth/react";

const baseURL =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : undefined);

export const authClient = createAuthClient(
    baseURL
        ? {
              baseURL,
          }
        : {},
);

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    forgetPassword,
    resetPassword
} = authClient;
