"use client";

import { useEffect } from "react";

export default function ViewSiteError({ error, reset }) {
  useEffect(() => {
    console.error("Publication View Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
        Oops! Something went wrong
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-lg">
        We were unable to load this content. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm"
      >
        Reload Page
      </button>
    </div>
  );
}
