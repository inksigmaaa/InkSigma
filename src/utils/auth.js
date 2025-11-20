import { authClient } from "@/lib/auth-client";

/**
 * Comprehensive logout function that clears all session data
 */
export const handleLogout = async () => {
    try {
        // Sign out from auth client
        await authClient.signOut();
        
        // Clear all localStorage data
        localStorage.clear();
        
        // Clear sessionStorage as well
        sessionStorage.clear();
        
        // Clear any cookies
        document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos) : c;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        });
        
        // Force a hard redirect to login page
        window.location.href = "/login";
    } catch (error) {
        console.error("Logout error:", error);
        // Even if there's an error, clear local data and redirect
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login";
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    // This can be enhanced based on your auth implementation
    return !!localStorage.getItem('auth-token') || !!sessionStorage.getItem('auth-token');
};