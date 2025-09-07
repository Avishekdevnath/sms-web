'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'username' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginIdentifier.trim()) {
      setError('Please enter your login identifier');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          loginIdentifier: loginIdentifier.trim(),
          loginMethod 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send password reset email');
      }

      setSuccess(data.message || 'Password reset email sent successfully!');
      setLoginIdentifier('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot Your Password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your login information and we'll send you a temporary password to reset your account.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  loginMethod === "email" ? "Enter your email" :
                  loginMethod === "username" ? "Enter your username" :
                  "Enter your phone number"
                }
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-500">
              Contact your administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
