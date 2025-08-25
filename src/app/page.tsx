"use client";

import Link from "next/link";
import { 
  GraduationCap, 
  Target, 
  Users, 
  BookOpen, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  Globe
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      name: "Student Management",
      description: "Comprehensive student enrollment, profile management, and academic tracking",
      icon: Users,
      color: "bg-black"
    },
    {
      name: "Mission System",
      description: "Create and manage student missions with real-world project experience",
      icon: Target,
      color: "bg-gray-800"
    },
    {
      name: "Course Management",
      description: "Organize courses by semesters and batches with flexible curriculum",
      icon: BookOpen,
      color: "bg-gray-700"
    },
    {
      name: "Analytics Dashboard",
      description: "Track performance metrics and generate insightful reports",
      icon: BarChart3,
      color: "bg-gray-600"
    },
    {
      name: "Role-Based Access",
      description: "Secure access control for admin, mentor, and student roles",
      icon: Shield,
      color: "bg-gray-500"
    },
    {
      name: "Real-time Updates",
      description: "Instant notifications and live progress tracking",
      icon: Zap,
      color: "bg-gray-400"
    }
  ];

  const stats = [
    { label: "Students", value: "500+", description: "Active enrollments" },
    { label: "Courses", value: "50+", description: "Available programs" },
    { label: "Missions", value: "25+", description: "Active projects" },
    { label: "Success Rate", value: "95%", description: "Student completion" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
                href="/login"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-lg font-semibold shadow-lg"
            >
              <Target className="w-5 h-5 mr-2" />
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/mission-hub"
              className="inline-flex items-center px-8 py-4 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-colors text-lg font-semibold"
            >
              <Users className="w-5 h-5 mr-2" />
              Explore Missions
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-black mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your educational institution effectively
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.name}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Institution?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of educators who are already using our platform to streamline their student management processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black text-lg font-bold">S</span>
                </div>
                <span className="text-xl font-bold">SMS Dashboard</span>
              </div>
              <p className="text-gray-400">
                Empowering educational institutions with comprehensive student management solutions.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/mission-hub" className="hover:text-white transition-colors">Mission Hub</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Student Management</li>
                <li>Mission System</li>
                <li>Course Management</li>
                <li>Analytics</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>API Reference</li>
                <li>Contact Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SMS Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
