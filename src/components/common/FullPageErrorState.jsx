"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

const buttonBaseClassName =
  "inline-flex min-w-[160px] items-center justify-center rounded-xl px-6 py-3 text-base font-medium transition duration-200";

export default function FullPageErrorState({
  title = "Something went wrong!",
  description = "An unexpected error occurred while loading this page. Our team has been notified.",
  primaryLabel = "Try again",
  onPrimaryAction,
  secondaryLabel = "Go Home",
  secondaryHref = "/",
  onSecondaryAction,
  className,
  contentClassName,
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-4 py-10",
        className,
      )}
    >
      <div className={cn("w-full max-w-3xl text-center", contentClassName)}>
        <div className="mb-6 inline-flex rounded-full bg-red-50 p-6 text-red-500">
          <svg
            className="h-16 w-16"
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
        <h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600">
          {description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {onPrimaryAction ? (
            <button
              type="button"
              onClick={onPrimaryAction}
              className={cn(buttonBaseClassName, "bg-black text-white hover:bg-gray-800")}
            >
              {primaryLabel}
            </button>
          ) : null}
          {secondaryHref ? (
            <Link
              href={secondaryHref}
              className={cn(
                buttonBaseClassName,
                "bg-gray-100 text-gray-900 hover:bg-gray-200",
              )}
            >
              {secondaryLabel}
            </Link>
          ) : onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className={cn(
                buttonBaseClassName,
                "bg-gray-100 text-gray-900 hover:bg-gray-200",
              )}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
