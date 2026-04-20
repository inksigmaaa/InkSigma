"use client";

import { useEffect } from "react";

import FullPageErrorState from "@/components/common/FullPageErrorState";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <FullPageErrorState
      onPrimaryAction={() => reset()}
      className="min-h-[70vh]"
    />
  );
}
