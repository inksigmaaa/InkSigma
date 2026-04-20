"use client";

import { useEffect } from "react";

import FullPageErrorState from "@/components/common/FullPageErrorState";

export default function ViewSiteError({ error, reset }) {
  useEffect(() => {
    console.error("Publication View Error Boundary Caught:", error);
  }, [error]);

  return (
    <FullPageErrorState
      description="We were unable to load this content. Please try again."
      onPrimaryAction={() => reset()}
      className="min-h-[70vh]"
    />
  );
}
