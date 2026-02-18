'use client';

import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import DashboardSidebar from "@/components/layout/sidebar/DashboardSidebar";
import { usePathname } from "next/navigation";

export default function UserLayout({ children }) {
  const pathname = usePathname();

  const isPreviewRoute = pathname?.includes("/preview");
  const isEditorRoute = pathname?.startsWith("/editor");

  if (isPreviewRoute || isEditorRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <NavbarLoggedin />
      <DashboardSidebar />
      {children}
    </>
  );
}
