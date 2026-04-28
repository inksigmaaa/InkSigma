import { getDashboardUrl } from "@/utils/dashboardUrl";

const AUTH_FLOW_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth-callback",
];

const createAbortError = () => {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

const delay = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
    };

    const handleResolve = () => {
      cleanup();
      resolve();
    };

    if (!signal) {
      timeoutId = setTimeout(handleResolve, ms);
      return;
    }

    const handleAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    timeoutId = setTimeout(handleResolve, ms);
    signal.addEventListener("abort", handleAbort, { once: true });
  });

export const isAuthFlowPath = (pathname = "") =>
  AUTH_FLOW_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const getCurrentAppPath = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
};

export const buildLoginRedirectPath = (redirectTo = getCurrentAppPath()) => {
  if (
    !redirectTo ||
    typeof redirectTo !== "string" ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("/login")
  ) {
    return "/login";
  }

  return redirectTo === "/"
    ? "/login"
    : `/login?redirect=${encodeURIComponent(redirectTo)}`;
};

export const getDefaultDashboardPath = () => {
  if (process.env.NEXT_PUBLIC_SAME_ORIGIN_DASHBOARD === "true") {
    return "/dashboard";
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (
      hostname === "dashboard.localhost" ||
      hostname.startsWith("dashboard.")
    ) {
      return "/";
    }
  }

  return getDashboardUrl("/");
};

export const buildAuthCallbackPath = ({
  redirectTo = "/",
  returnTo = "",
} = {}) =>
  returnTo
    ? `/auth-callback?returnTo=${encodeURIComponent(returnTo)}`
    : redirectTo && redirectTo !== "/"
      ? `/auth-callback?redirect=${encodeURIComponent(redirectTo)}`
      : "/auth-callback";

export const getAuthenticatedLoginRedirectPath = ({
  redirectTo = "/",
  returnTo = "",
} = {}) => {
  if (returnTo || redirectTo?.startsWith("/invite/")) {
    return buildAuthCallbackPath({ redirectTo, returnTo });
  }

  if (redirectTo && redirectTo !== "/") {
    return redirectTo;
  }

  return getDefaultDashboardPath();
};

export const getPostLogoutPath = () => "/login";

export const waitForServerSession = async ({
  attempts = 4,
  delayMs = 200,
  signal,
} = {}) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    try {
      const response = await fetch("/api/auth/get-session", {
        credentials: "include",
        cache: "no-store",
        signal,
      });

      if (response.ok) {
        const sessionData = await response.json().catch(() => null);
        if (sessionData?.user?.id) {
          return sessionData;
        }
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
    }

    if (attempt < attempts) {
      await delay(delayMs * attempt, signal);
    }
  }

  return null;
};
