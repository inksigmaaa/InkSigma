import { createAuthClient } from "better-auth/react";
import { getApiBase } from "@/utils/apiBase";

// Compute baseURL - this may run during SSR/hydration
// The AuthContext has retry logic to handle any hydration race conditions
const baseURL = getApiBase();

export const authClient = createAuthClient({
    baseURL: baseURL,
    basePath: "/api/auth",
    fetchOptions: {
        credentials: "include",
    },
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    resetPassword,
    forgetPassword,
    $Infer
} = authClient;
