import { createAuthClient } from "better-auth/react";

// Auth is handled by Next.js on the same origin (no cross-origin calls needed).
// Use window.location.origin in the browser; fall back to the app URL for SSR.
const getAuthBaseURL = () => {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || "https://inksigma.xyz";
};

export const authClient = createAuthClient({
    baseURL: getAuthBaseURL(),
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
