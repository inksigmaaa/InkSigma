import { signIn, signUp, signOut } from '@/lib/auth-client';

const API_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:5000';

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const response = await signIn.email({
      email: credentials.email,
      password: credentials.password,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Login failed');
    }

    return response.data;
  },

  async register(userData: { name: string; email: string; password: string }) {
    const response = await signUp.email({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Registration failed');
    }

    return response.data;
  },

  async logout() {
    const response = await signOut();

    if (response.error) {
      throw new Error(response.error.message || 'Logout failed');
    }

    return response.data;
  },

  async forgotPassword(email: string, redirectTo?: string) {
    const response = await fetch(`${API_URL}/api/custom/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  async resetPassword(token: string, email: string, newPassword: string) {
    const response = await fetch(`${API_URL}/api/custom/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, newPassword }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },
};
