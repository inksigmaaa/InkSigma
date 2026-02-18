"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import PasswordField from "@/components/auth/PasswordField";

export default function SetPasswordForm({ onSuccess, onCancel }) {
  const { data: session } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canSetPassword, setCanSetPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // Check if user can set password on mount
  useEffect(() => {
    async function checkCanSetPassword() {
      if (!session?.user) {
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/custom/can-set-password`, {
          credentials: "include",
        });
        const data = await res.json();
        setCanSetPassword(data.canSet);
      } catch (err) {
        console.error("Failed to check password status:", err);
      } finally {
        setChecking(false);
      }
    }

    checkCanSetPassword();
  }, [session, API_URL]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validatePassword()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/custom/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set password");
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // Loading state
  if (checking) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not logged in
  if (!session?.user) {
    return (
      <div className="p-6 text-center text-gray-600">
        Please log in to set your password.
      </div>
    );
  }

  // Already has password or not a Google user
  if (!canSetPassword) {
    return null; // Don't render anything if user can't set password
  }

  // Success state
  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Password set successfully!</span>
        </div>
        <p className="mt-2 text-sm text-green-600">
          You can now log in using your email and password.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Set Your Password
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        You signed in with Google. Set a password to also log in with email.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="w-full">
          <PasswordField
            id="password"
            label="New Password"
            placeholder="Min 8 characters"
            value={password}
            onChange={handlePasswordChange}
            minLength={8}
            className="w-full"
          />
        </div>

        <div className="w-full">
          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            minLength={8}
            className="w-full"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Later
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
