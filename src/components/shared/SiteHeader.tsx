"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SiteHeader() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SMS Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/mission-hub"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Mission Hub
                </Link>
                <Link
                  href="/mission-communication-hub"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Communication Hub
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.name || user?.email}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


