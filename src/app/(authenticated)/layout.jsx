'use client';

import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import { usePathname } from "next/navigation";

export default function AuthenticatedLayout({ children }) {
  const pathname = usePathname();

  const isPreviewRoute = pathname?.includes("/preview");
  const isEditorRoute = pathname?.startsWith("/editor");

  if (isPreviewRoute || isEditorRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <NavbarLoggedin />
      {children}
    </>
  );
}
