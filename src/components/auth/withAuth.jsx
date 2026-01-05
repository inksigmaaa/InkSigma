"use client";

import AuthGuard from "./AuthGuard";

/**
 * Higher-order component that wraps a component with authentication protection
 * @param {React.Component} WrappedComponent - The component to protect
 * @param {string} redirectTo - Where to redirect if not authenticated (default: "/login")
 * @returns {React.Component} - Protected component
 */
export default function withAuth(WrappedComponent, redirectTo = "/login") {
  return function AuthenticatedComponent(props) {
    return (
      <AuthGuard redirectTo={redirectTo}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };
}