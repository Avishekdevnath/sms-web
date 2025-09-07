"use client";

import Link from "next/link";
import { Globe, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Cta() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Transform Your Institution?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of educators who are already using our platform to streamline their student management processes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors text-lg font-semibold"
              >
                <Globe className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Link>
              <Link
                href="/mission-hub"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-black transition-colors text-lg font-semibold"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Mission Hub
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors text-lg font-semibold"
              >
                <Globe className="w-5 h-5 mr-2" />
                Start Free Trial
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-black transition-colors text-lg font-semibold"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Documentation
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


