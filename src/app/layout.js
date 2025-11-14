import { Public_Sans, Allison } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { ArticlesProvider } from "@/contexts/ArticlesContext";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${allison.variable} antialiased`}
      >
        <ArticlesProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </ArticlesProvider>
      </body>
    </html>
  );
}
