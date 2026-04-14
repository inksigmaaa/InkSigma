import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvitationPage({ params }) {
  const { token } = await params;
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "")
    .split(",")[0]
    .trim();
  const protocol = h.get("x-forwarded-proto") || "http";
  const hostname = host
    .split(":")[0]
    .replace(/^www\./, "")
    .toLowerCase();
  const port = host.includes(":") ? `:${host.split(":")[1]}` : "";

  // Force invite flows onto the dashboard host so auth cookies work consistently.
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost");
  const desiredHost =
    rootDomain === "localhost"
      ? "dashboard.localhost"
      : `dashboard.${rootDomain}`;
  const isDashboardHost =
    hostname === desiredHost ||
    hostname === "dashboard.localhost" ||
    hostname.startsWith("dashboard.");

  if (!isDashboardHost) {
    redirect(`${protocol}://${desiredHost}${port}/invite/${token}`);
  }

  // Always redirect to the accept page.
  // The client-side accept page handles authentication via useSession().
  // Server-side cookie checks with better-auth are unreliable here.
  redirect(`/invite/${token}/accept`);
}
