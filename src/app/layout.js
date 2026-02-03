import { Public_Sans, Allison } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { ArticlesProvider } from "@/contexts/ArticlesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicationProvider } from "@/contexts/PublicationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { headers } from "next/headers";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const allison = Allison({
  variable: "--font-allison",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "InkSigma - A platform for focussed and simple writing",
  description: "Designed for you to write passionately. Write and Grow together.",
};

export default async function RootLayout({ children }) {
  const h = await headers();
  const rawHost = h.get("x-forwarded-host") || h.get("host") || "";
  const hostname = rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
  const cleanHost = hostname.replace(/^www\./, "");

  // Ensure client/server agree on dashboard host detection to avoid hydration mismatches.
  const isDashboardHost =
    cleanHost === "dashboard.localhost" || cleanHost.startsWith("dashboard.");

  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${allison.variable} antialiased`}
      >
        <AuthProvider>
          <PublicationProvider>
            <ArticlesProvider>
              <ToastProvider>
                <ConditionalLayout isDashboardHost={isDashboardHost}>
                  {children}
                </ConditionalLayout>
              </ToastProvider>
            </ArticlesProvider>
          </PublicationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
