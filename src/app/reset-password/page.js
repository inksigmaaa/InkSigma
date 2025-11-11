"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { resetPassword } from "@/lib/auth-client"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [token, setToken] = useState("")

    useEffect(() => {
        const tokenParam = searchParams.get("token")
        if (tokenParam) {
            setToken(tokenParam)
        } else {
            setError("Invalid or missing reset token")
        }
    }, [searchParams])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            return
        }

        if (!token) {
            setError("Invalid reset token")
            return
        }

        setLoading(true)

        try {
            await resetPassword({
                newPassword: password,
                token
            })
            setSuccess(true)
            setTimeout(() => {
                router.push("/login")
            }, 3000)
        } catch (err) {
            console.error('Password reset error:', err)
            setError(err.message || "Failed to reset password. The link may have expired.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <AuthLayout title="Password Reset Successful">
                <div className="space-y-6 text-center">
                    <div className="flex justify-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-gray-700">
                            Your password has been successfully reset!
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting you to login...
                        </p>
                    </div>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title="Reset Password">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">
                        New Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-gray-900"
                            required
                            disabled={loading}
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700">
                        Confirm Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-gray-900"
                            required
                            disabled={loading}
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3"
                    disabled={loading || !token}
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </Button>
            </form>
            <div className="text-center pt-4">
                <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Login
                </Link>
            </div>
        </AuthLayout>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <AuthLayout title="Reset Password">
                <div className="space-y-6">
                    <div className="text-center text-gray-500">Loading...</div>
                </div>
            </AuthLayout>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
