"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { signUp, signIn } from "@/lib/auth-client";
import { CheckCircle2, ArrowLeft } from "lucide-react";

function SignupForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const returnTo = searchParams.get("returnTo") || "";

  const getOrigin = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://localhost:3000";
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const callbackPath = returnTo
        ? `/auth-callback?returnTo=${encodeURIComponent(returnTo)}`
        : redirectTo !== "/"
          ? `/auth-callback?redirect=${encodeURIComponent(redirectTo)}`
          : "/auth-callback";

      const result = await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        callbackURL: `${getOrigin()}${callbackPath}`,
      });

      if (result.error) {
        setError(result.error.message || "Failed to sign up");
        return;
      }

      // Show verification message
      setVerificationSent(true);
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const origin = getOrigin();
      const callbackPath = returnTo
        ? `/auth-callback?returnTo=${encodeURIComponent(returnTo)}`
        : redirectTo !== "/"
          ? `/auth-callback?redirect=${encodeURIComponent(redirectTo)}`
          : "/auth-callback";

      await signIn.social({
        provider: "google",
        callbackURL: `${origin}${callbackPath}`,
        prompt: "select_account",
      });
    } catch (err) {
      setError("Failed to sign up with Google");
      console.error(err);
    }
  };

  if (verificationSent) {
    return (
      <div className="relative min-h-screen flex items-center">
        <AuthLayout title="Verify Your Email" compact>
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-700">
                We&apos;ve sent a verification link to{" "}
                <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Please check your inbox and click the link to verify your email
                before logging in.
              </p>
            </div>
            <div className="text-center pt-4">
              <Link
                href={
                  returnTo
                    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
                    : redirectTo !== "/"
                      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
                      : "/login"
                }
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Go to Login
              </Link>
            </div>
          </div>
        </AuthLayout>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AuthLayout title="Welcome, Sign up here!">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-center text-center">
            <span className="block w-full text-center">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 text-sm md:text-sm">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your Name"
              value={formData.name}
              onChange={handleInputChange("name")}
              minLength={2}
              maxLength={100}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 focus:ring-offset-0 w-full text-sm placeholder:text-[#C8C8C8]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 text-sm md:text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your Email"
              value={formData.email}
              onChange={handleInputChange("email")}
              minLength={5}
              maxLength={254}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 focus:ring-offset-0 w-full text-sm placeholder:text-[#C8C8C8]"
              style={{
                boxShadow: "0 0 0 30px white inset",
                WebkitBoxShadow: "0 0 0 30px white inset",
              }}
              required
            />
          </div>

          <PasswordField
            id="password"
            label="Create Password"
            placeholder="Create your password"
            value={formData.password}
            onChange={handleInputChange("password")}
            minLength={12}
            maxLength={128}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-[259px] h-[32px] opacity-100 rotate-0 gap-[10px] rounded-[4px] pt-[8px] md:pt-[8px] pr-[20px] md:pr-[109px] pb-[8px] md:pb-[8px] pl-[20px] md:pl-[109px] bg-[#080808] hover:bg-gray-800 disabled:opacity-50 !mt-10 mx-auto border-0 flex items-center justify-center"
          >
            <span className="w-auto h-[18px] md:h-[21px] opacity-100 rotate-0 font-medium text-[14px] leading-[150%] tracking-[0%] text-[#EDEDED] whitespace-nowrap">
              {loading ? "Signing up..." : "Sign Up"}
            </span>
          </Button>
        </form>

        <div className="text-center mt-2 md:mt-4 flex items-center justify-center gap-1">
          <span
            className="w-auto md:w-[102px] h-auto md:h-[21px] opacity-100 rotate-0 font-medium text-[12px] md:text-[14px] leading-[150%] tracking-[0%] text-[#2E2E2E]"
            style={{ fontFamily: "Public Sans" }}
          >
            Already a user?
          </span>
          <Link
            href={
              returnTo
                ? `/login?returnTo=${encodeURIComponent(returnTo)}`
                : redirectTo !== "/"
                  ? `/login?redirect=${encodeURIComponent(redirectTo)}`
                  : "/login"
            }
            className="w-auto md:w-[37px] h-auto md:h-[16px] opacity-100 rotate-0 font-medium text-[12px] md:text-[14px] leading-[100%] tracking-[0%] underline decoration-solid decoration-0 text-[#4B4B4B] hover:text-gray-600 transition-colors"
          >
            Login
          </Link>
        </div>

        <div className="text-center text-gray-400 mt-2 md:mt-3 text-sm md:text-base">
          or
        </div>

        <div className="mt-2 md:mt-3">
          <GoogleAuthButton
            text="Sign up with Google"
            onClick={handleGoogleSignup}
          />
        </div>

        <div className="w-auto h-[16px] opacity-100 rotate-0 mt-8 mx-auto flex items-center justify-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-gray-500 transition-colors"
          >
            <svg
              width="7"
              height="11"
              viewBox="0 0 7 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.48975 0.700195L0.989746 5.2002L5.48975 9.7002"
                stroke="#696969"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#696969]">
              Go Back to website
            </span>
          </Link>
        </div>
      </AuthLayout>

      {/* Copyright - positioned 32px from bottom */}
      <div className="absolute bottom-[16px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
        <p
          className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap"
          style={{ fontFamily: "Inter" }}
        >
          Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc.
          brand
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
