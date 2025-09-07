"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageTitle from "@/components/shared/PageTitle";
import { PAGE_TITLES } from "@/utils/titleUtils";
import { useAuth } from "@/context/AuthContext";
import PasswordInput from "@/components/shared/PasswordInput";

// Separate component for search params to use Suspense
function LoginForm() {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "username" | "phone">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          loginIdentifier, 
          loginMethod, 
          password 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error?.message || "Login failed");
      }
      
      // Update auth context
      login(data.user);
      
      // Check if user has a temporary password and redirect accordingly
      if (data.user.passwordExpiresAt || data.user.mustChangePassword) {
        // User has temporary password or must change password, redirect to change password page
        router.push('/change-password');
      } else if (data.user.role === 'student' && !data.user.profileCompleted) {
        // Student with incomplete profile, redirect to standalone profile completion page
        router.push('/profile-complete');
      } else {
        // Normal login, redirect to the intended page or dashboard
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <PageTitle title={PAGE_TITLES.LOGIN} />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Method
              </label>
              <div className="flex space-x-2 mb-2">
                {[
                  { value: "email", label: "Email", placeholder: "Enter your email" },
                  { value: "username", label: "Username", placeholder: "Enter your username" },
                  { value: "phone", label: "Phone", placeholder: "Enter your phone number" }
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setLoginMethod(method.value as "email" | "username" | "phone")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      loginMethod === method.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
              
              <input
                type={loginMethod === "email" ? "email" : "text"}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={
                  loginMethod === "email" ? "Enter your email" :
                  loginMethod === "username" ? "Enter your username" :
                  "Enter your phone number"
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500 text-sm">
              Forgot your password?
            </Link>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <Link href="/invitation" className="text-blue-600 hover:text-blue-500 text-sm">
              Get invited
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
} 