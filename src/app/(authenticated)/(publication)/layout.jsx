'use client';

import Sidebar from "@/components/layout/sidebar/Sidebar";
import VisitSiteButton from "@/components/VisitSiteButton";
import { usePathname } from "next/navigation";

export default function PublicationLayout({ children }) {
  const pathname = usePathname();

  const isPreviewRoute = pathname?.includes("/preview");
  const isEditorRoute = pathname?.startsWith("/editor");

  if (isPreviewRoute || isEditorRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      {children}
      <VisitSiteButton />
    </>
  );
}
