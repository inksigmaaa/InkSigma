"use client";

import { useEffect } from "react";

import FullPageErrorState from "@/components/common/FullPageErrorState";

export default function AuthenticatedError({ error, reset }) {
  useEffect(() => {
    console.error("Authenticated Route Error Boundary Caught:", error);
  }, [error]);

  return (
    <FullPageErrorState
      title="Something went wrong!"
      description="An unexpected error occurred while loading this page. Our team has been notified."
      onPrimaryAction={() => reset()}
      className="min-h-[70vh]"
    />
  );
}
