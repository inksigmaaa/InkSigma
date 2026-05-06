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
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import { headers } from "next/headers";

export const metadata = {
  title: "InkSigma - A platform for focussed and simple writing",
  description:
    "Designed for you to write passionately. Write and Grow together.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default async function RootLayout({ children }) {
  const h = await headers();
  const rawHost = h.get("x-forwarded-host") || h.get("host") || "";

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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${publicSans.variable} ${allison.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <ConditionalLayout
            isDashboardHost={isDashboardHost}
            isPublicationSubdomain={isPublicationSubdomain}
          >
            {children}
          </ConditionalLayout>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
