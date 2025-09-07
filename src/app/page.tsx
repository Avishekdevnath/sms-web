import Features from "@/components/shared/Features";
import Hero from "@/components/shared/Hero";
import SiteFooter from "@/components/shared/SiteFooter";
import SiteHeader from "@/components/shared/SiteHeader";
import Stats from "@/components/shared/Stats";
import Cta from "@/components/shared/Cta";

import { 
  Target, 
  Users, 
  BookOpen, 
  BarChart3,
  Shield,
  Zap
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
      <SiteHeader />
      <Hero />
      <Stats stats={stats} />
      <Features features={features} />
      <Cta />
      <SiteFooter />
    </div>
  );
}
