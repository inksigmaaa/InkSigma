import { createAuthClient } from "better-auth/react";
import { getApiBase } from "@/utils/apiBase";

export const authClient = createAuthClient({
    baseURL: getApiBase(),
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
