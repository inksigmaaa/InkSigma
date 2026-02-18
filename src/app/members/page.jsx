"use client";

import Link from "next/link";
import { usePublication } from "@/contexts/PublicationContext";
import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import Verify from "@/components/features/verify/Verify";
import Members from "@/components/features/members/Members";

export default function MembersPage() {
  const { currentPublication } = usePublication();

  return (
    <div className="bg-white min-h-screen">
      <NavbarLoggedin />
      <Sidebar />
      <Verify />

      <div className="pt-[112px] pb-10 px-5 max-w-[1034px] mx-auto flex gap-10 relative max-md:pt-[80px] max-md:flex-col max-md:gap-0 max-md:px-4">
        {/* Main Content */}
        <div className="ml-[185px] flex-1 w-[calc(100%-185px)] max-md:ml-0 max-md:w-full">
          <Members />
        </div>
      </div>
    </div>
  );
}
