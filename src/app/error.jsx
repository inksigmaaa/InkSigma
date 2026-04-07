"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-red-50 text-red-500 rounded-full p-6 mb-6">
        <svg
          className="w-16 h-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Something went wrong!
      </h2>
      <p className="text-gray-600 mb-8 max-w-lg text-lg">
        An unexpected error occurred while loading this page. Our team has been
        notified.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition duration-200"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-3 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition duration-200"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
