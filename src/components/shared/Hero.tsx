"use client";

import Link from "next/link";
import { GraduationCap, Target, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Student Management
            <span className="block text-black">System</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A comprehensive platform for managing student missions, courses, and academic progress. 
            Streamline your educational institution with our powerful dashboard and mission management system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-lg font-semibold shadow-lg"
              >
                <Target className="w-5 h-5 mr-2" />
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/mission-hub"
                className="inline-flex items-center px-8 py-4 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-colors text-lg font-semibold"
              >
                <Users className="w-5 h-5 mr-2" />
                Mission Hub
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-lg font-semibold shadow-lg"
              >
                <Target className="w-5 h-5 mr-2" />
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-colors text-lg font-semibold"
              >
                <Users className="w-5 h-5 mr-2" />
                Sign In to Explore
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


