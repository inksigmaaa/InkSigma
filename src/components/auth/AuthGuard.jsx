"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  buildLoginRedirectPath,
  getCurrentAppPath,
  waitForServerSession,
} from "@/utils/auth";

export default function AuthGuard({ children }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState("checking"); // checking | authorized | unauthorized
  const userId = session?.user?.id;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const checkAuth = async () => {
      if (isPending) {
        if (!cancelled) setAuthState("checking");
        return;
      }

      if (!userId) {
        try {
          const sessionData = await waitForServerSession({
            attempts: 4,
            signal: controller.signal,
          });

          if (sessionData?.user?.id) {
            if (!cancelled) setAuthState("authorized");
            return;
          }
        } catch (error) {
          if (error?.name === "AbortError") {
            return;
          }

          // Continue to login redirect on network/auth errors.
        }

        if (!cancelled) setAuthState("unauthorized");
        router.replace(
          buildLoginRedirectPath(getCurrentAppPath() || pathname || "/"),
        );
        return;
      }

      // Authorize immediately to avoid UI blocking on slow publication checks.
      if (!cancelled) setAuthState("authorized");
    };

    checkAuth();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isPending, pathname, router, userId]);

  // Allow content to render while session is being verified
  // This prevents UI blocking on slow auth checks
  if (authState === "unauthorized") {
    return null;
  }

  return children;
}
