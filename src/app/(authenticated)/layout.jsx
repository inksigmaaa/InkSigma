'use client';

import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicationProvider } from "@/contexts/PublicationContext";
import { ArticlesProvider } from "@/contexts/ArticlesContext";
import { usePathname } from "next/navigation";

export default function AuthenticatedLayout({ children }) {
  const pathname = usePathname();

  const isPreviewRoute = pathname?.includes("/preview");
  const isEditorRoute = pathname?.startsWith("/editor");

  const content =
    isPreviewRoute || isEditorRoute ? (
      <>{children}</>
    ) : (
      <>
        <NavbarLoggedin />
        {children}
      </>
    );

  return (
    <AuthProvider>
      <PublicationProvider>
        <ArticlesProvider>{content}</ArticlesProvider>
      </PublicationProvider>
    </AuthProvider>
  );
}
