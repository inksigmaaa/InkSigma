"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getApiBase } from "@/utils/apiBase";

export default function AuthGuard({ children }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState("checking"); // checking | authorized | unauthorized
  const userId = session?.user?.id;

  const skipPublicationCheck = useMemo(() => {
    return pathname === "/create-publication" || pathname?.startsWith("/invite/");
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      if (isPending) {
        if (!cancelled) setAuthState("checking");
        return;
      }

      if (!userId) {
        // Confirm with server once before redirecting.
        // This avoids false redirects right after login while client session is still hydrating.
        try {
          const response = await fetch(`${getApiBase()}/api/auth/get-session`, {
            credentials: "include",
          });
          const sessionData = response.ok
            ? await response.json().catch(() => null)
            : null;

          if (sessionData?.user?.id) {
            if (!cancelled) setAuthState("authorized");
            return;
          }
        } catch {
          // Continue to login redirect on network/auth errors.
        }

        if (!cancelled) setAuthState("unauthorized");
        router.replace("/login");
        return;
      }

      // Authorize immediately to avoid UI blocking on slow publication checks.
      if (!cancelled) setAuthState("authorized");

      if (skipPublicationCheck) return;

      const cacheKey = `publication-check-${userId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached === "true") return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${getApiBase()}/api/members/user/publications`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json().catch(() => null);
        const publications = Array.isArray(data) ? data : data?.publications || [];
        const hasPublication = Array.isArray(publications) && publications.length > 0;

        sessionStorage.setItem(cacheKey, hasPublication.toString());

        if (!hasPublication && !cancelled) {
          setAuthState("unauthorized");
          router.replace("/create-publication");
        }
      } catch {
        // Keep user on page if publication check is slow/unavailable.
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [isPending, userId, router, skipPublicationCheck]);

  // Allow content to render while session is being verified
  // This prevents UI blocking on slow auth checks
  if (authState === "unauthorized") {
    return null;
  }

  return children;
}
