import { createAuthClient } from "better-auth/react";

const getAuthBaseUrl = () => {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
    }

    return "http://localhost:3000";
};

export const authClient = createAuthClient({
    baseURL: getAuthBaseUrl(),
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
