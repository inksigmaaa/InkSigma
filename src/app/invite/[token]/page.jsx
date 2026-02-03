import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const getBackendBase = async () => {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("host") || "localhost";
  const protocol = h.get("x-forwarded-proto") || "http";
  const hostname = host.split(":")[0].replace(/^www\./, "");

  return `${protocol}://${hostname}:5000`;
};

export default async function InvitationPage({ params }) {
  const { token } = await params;
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  const protocol = h.get("x-forwarded-proto") || "http";
  const hostname = host.split(":")[0].replace(/^www\./, "").toLowerCase();
  const port = host.includes(":") ? `:${host.split(":")[1]}` : "";

  // Force invite flows onto the dashboard host so auth cookies work consistently.
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
  const desiredHost = rootDomain === "localhost" ? "dashboard.localhost" : `dashboard.${rootDomain}`;
  const isDashboardHost =
    hostname === desiredHost ||
    hostname === "dashboard.localhost" ||
    hostname.startsWith("dashboard.");

  if (!isDashboardHost) {
    redirect(`${protocol}://${desiredHost}${port}/invite/${token}`);
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token") || cookieStore.get("session_token");

  // Optimistic Check: If no session token cookie exists, user is definitely logged out.
  // Redirect immediately to avoid unnecessary backend fetch and potential timeouts.
  if (!sessionToken) {
    console.log("No session token found in cookies. Redirecting to login.");
    redirect(`/login?redirect=/invite/${token}/accept`);
  }

  const cookieString = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  let session = null;

  try {
    // Set a timeout for the fetch to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const backendBase = await getBackendBase();
    const res = await fetch(`${backendBase}/api/auth/get-session`, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      session = await res.json();
    }
  } catch (error) {
    console.error("Error checking session:", error);
    // If backend check fails, assume logged out or err on safe side -> login
    // But if we had a token and it failed, maybe we should let them try login again
  }

  if (session?.user) {
    // User is logged in, redirect to accept page
    console.log("Session verified. Redirecting to accept page.");
    redirect(`/invite/${token}/accept`);
  } else {
    // User is not logged in or session invalid
    console.log("No valid session verified. Redirecting to login.");
    redirect(`/login?redirect=/invite/${token}/accept`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-gray-500 mb-4">Processing invitation...</div>
    </div>
  );
}
