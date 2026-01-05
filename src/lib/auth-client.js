import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:5000",
    basePath: "/api/auth",
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    resetPassword,
    forgetPassword
} = authClient;
