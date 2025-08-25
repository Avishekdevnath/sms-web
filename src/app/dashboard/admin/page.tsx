"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalMissions: number;
  activeMissions: number;
  totalBatches: number;
  totalAssignments: number;
  pendingAssignments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalMissions: 0,
    activeMissions: 0,
    totalBatches: 0,
    totalAssignments: 0,
    pendingAssignments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [studentsRes, coursesRes, missionsRes, batchesRes, assignmentsRes] = await Promise.all([
        fetch('/api/students?limit=1'),
        fetch('/api/courses?limit=1'),
        fetch('/api/missions?limit=1'),
        fetch('/api/batches?limit=1'),
        fetch('/api/assignments?limit=1')
      ]);

      const studentsData = await studentsRes.json();
      const coursesData = await coursesRes.json();
      const missionsData = await missionsRes.json();
      const batchesData = await batchesRes.json();
      const assignmentsData = await assignmentsRes.json();

      setStats({
        totalStudents: studentsData.total || 0,
        totalCourses: coursesData.total || 0,
        totalMissions: missionsData.total || 0,
        activeMissions: missionsData.missions?.filter((m: any) => m.status === 'active').length || 0,
        totalBatches: batchesData.total || 0,
        totalAssignments: assignmentsData.total || 0,
        pendingAssignments: assignmentsData.assignments?.filter((a: any) => !a.submitted).length || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: "Create Mission",
      description: "Start a new mission for students",
      href: "/dashboard/admin/missions/create",
    },
    {
      name: "Manage Batches",
      description: "View and manage student batches",
      href: "/dashboard/admin/batches",
    },
    {
      name: "Manage Semesters",
      description: "View and manage academic semesters",
      href: "/dashboard/admin/semesters",
    },
    {
      name: "Manage Courses",
      description: "Create and manage academic courses",
      href: "/dashboard/admin/courses",
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="border rounded-lg p-6 bg-white">
        <h1 className="text-4xl font-bold text-black">Admin Dashboard</h1>
        <p className="mt-3 text-xl text-gray-600">Manage your Student Management System</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border rounded-lg p-6 bg-white text-center">
          <p className="text-sm font-medium text-gray-500">Total Students</p>
          <p className="text-3xl font-bold text-black">{stats.totalStudents}</p>
        </div>

        <div className="border rounded-lg p-6 bg-white text-center">
          <p className="text-sm font-medium text-gray-500">Total Courses</p>
          <p className="text-3xl font-bold text-black">{stats.totalCourses}</p>
        </div>

        <div className="border rounded-lg p-6 bg-white text-center">
          <p className="text-sm font-medium text-gray-500">Active Missions</p>
          <p className="text-3xl font-bold text-black">{stats.activeMissions}</p>
        </div>

        <div className="border rounded-lg p-6 bg-white text-center">
          <p className="text-sm font-medium text-gray-500">Pending Assignments</p>
          <p className="text-3xl font-bold text-black">{stats.pendingAssignments}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="text-2xl font-bold text-black mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="border rounded-lg p-6 text-center hover:border-black transition-colors"
            >
              <p className="text-lg font-semibold text-black">
                {action.name}
              </p>
              <p className="text-sm text-gray-500 mt-2">{action.description}</p>
              <ArrowRight className="h-5 w-5 text-gray-400 mx-auto mt-3" />
            </Link>
          ))}
        </div>
      </div>

                               {/* Management Sections */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Missions Management */}
           <div className="border rounded-lg p-6 bg-white">
             <h3 className="text-xl font-bold text-black mb-6">Missions</h3>
             <div className="space-y-3">
               <Link
                 href="/dashboard/admin/missions"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">View All Missions</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
               <Link
                 href="/dashboard/admin/missions/create"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">Create New Mission</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
             </div>
           </div>

           {/* Batch Management */}
           <div className="border rounded-lg p-6 bg-white">
             <h3 className="text-xl font-bold text-black mb-6">Batches</h3>
             <div className="space-y-3">
               <Link
                 href="/dashboard/admin/batches"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">View All Batches</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
               <Link
                 href="/dashboard/admin/batches/create"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">Create New Batch</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
             </div>
           </div>

           {/* Semester Management */}
           <div className="border rounded-lg p-6 bg-white">
             <h3 className="text-xl font-bold text-black mb-6">Semesters</h3>
             <div className="space-y-3">
               <Link
                 href="/dashboard/admin/semesters"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">View All Semesters</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
               <Link
                 href="/dashboard/admin/semesters/create"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">Create New Semester</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
             </div>
           </div>

           {/* Course Management */}
           <div className="border rounded-lg p-6 bg-white">
             <h3 className="text-xl font-bold text-black mb-6">Courses</h3>
             <div className="space-y-3">
               <Link
                 href="/dashboard/admin/courses"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">View All Courses</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
               <Link
                 href="/dashboard/admin/courses/create"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">Create New Course</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
               <Link
                 href="/dashboard/admin/course-offerings"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">Manage Offerings</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
             </div>
           </div>

           {/* Assignment Management */}
           <div className="border rounded-lg p-6 bg-white">
             <h3 className="text-xl font-bold text-black mb-6">Assignments</h3>
             <div className="space-y-3">
               <Link
                 href="/dashboard/admin/assignments"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">View All Assignments</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
               <Link
                 href="/dashboard/admin/assignments/create"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">Create New Assignment</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
             </div>
           </div>

           {/* Student Management */}
           <div className="border rounded-lg p-6 bg-white">
             <h3 className="text-xl font-bold text-black mb-6">Students</h3>
             <div className="space-y-3">
                               <Link
                  href="/dashboard/admin/students"
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
                >
                  <span className="font-medium">View All Students</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
               <Link
                 href="/dashboard/admin/students/enroll"
                 className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
               >
                 <span className="font-medium">Enroll New Student</span>
                 <ArrowRight className="h-4 w-4 text-gray-400" />
               </Link>
             </div>
           </div>
         </div>
    </div>
  );
}
