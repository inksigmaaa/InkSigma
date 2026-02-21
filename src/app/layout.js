import { Public_Sans, Allison } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-public-sans",
});

const allison = Allison({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allison",
});
import ConditionalLayout from "@/components/ConditionalLayout";
import { ToastProvider } from "@/contexts/ToastContext";
import { Providers } from "@/components/Providers";
import { headers } from "next/headers";

const DASHBOARD_PATHS = [
  "/home",
  "/allArticle",
  "/review",
  "/author-review",
  "/editor",
  "/draft",
  "/published",
  "/unpublished",
  "/trash",
  "/schedule",
  "/members",
  "/my-blogs",
  "/profile-settings",
  "/domain",
  "/dashboard",
  "/create-publication",
  "/settings",
  "/invite",
  "/comments",
];

const PUBLIC_ONLY_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/magic-link",
  "/auth-callback",
];

export const metadata = {
  title: "InkSigma - A platform for focussed and simple writing",
  description:
    "Designed for you to write passionately. Write and Grow together.",
  icons: {
    icon: "/icons/favicon.svg",
  },
};

export default async function RootLayout({ children }) {
  const h = await headers();
  const rawHost = h.get("x-forwarded-host") || h.get("host") || "";
  const pathname = h.get("x-invoke-path") || "/";

  const hostname = rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
  const cleanHost = hostname.replace(/^www\./, "");

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
  const isDashboardHost =
    cleanHost === `dashboard.${rootDomain}` ||
    cleanHost.startsWith("dashboard.");

  const isPublicationSubdomain =
    cleanHost !== rootDomain &&
    cleanHost !== `www.${rootDomain}` &&
    !isDashboardHost;

  const isDashboardPath = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.some((p) =>
    pathname.startsWith(p),
  );

  const needsDashboard =
    isDashboardHost ||
    isPublicationSubdomain ||
    (isDashboardPath && !isPublicOnlyPath);

  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${allison.variable} antialiased`}
      >
        <ToastProvider>
          <Providers isDashboard={needsDashboard}>
            <ConditionalLayout
              isDashboardHost={isDashboardHost}
              isPublicationSubdomain={isPublicationSubdomain}
            >
              {children}
            </ConditionalLayout>
          </Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
