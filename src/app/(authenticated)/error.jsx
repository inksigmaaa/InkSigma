"use client";

import { useEffect } from "react";

export default function AuthenticatedError({ error, reset }) {
  useEffect(() => {
    console.error("Authenticated Route Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm m-4 lg:m-8">
      <div className="bg-orange-50 text-orange-500 rounded-full p-5 mb-5">
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Dashboard Error</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        We encountered a problem loading this section of your dashboard. You can
        try refreshing the view.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition duration-200"
      >
        Refresh View
      </button>
    </div>
  );
}
