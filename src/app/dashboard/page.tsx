import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  Target, 
  BarChart3, 
  Calendar,
  ArrowRight,
  Plus
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function getCurrentUser() {
  try {
    const cs = await cookies();
    const cookie = cs.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
    const res = await fetch(`${BASE}/api/auth/me`, { headers: { cookie }, cache: "no-store" });
    
    if (!res.ok) {
      if (res.status === 401) {
        redirect("/login");
      }
      throw new Error("Failed to fetch user");
    }
    
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error("Authentication error:", error);
    redirect("/login");
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  async function getStats() {
    try {
      const cs = await cookies();
      const cookie = cs.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
      const [studentsRes, coursesRes, missionsRes, assignmentsRes] = await Promise.all([
        fetch(`${BASE}/api/students?limit=1`, { headers: { cookie }, cache: "no-store" }),
        fetch(`${BASE}/api/courses?limit=1`, { headers: { cookie }, cache: "no-store" }),
        fetch(`${BASE}/api/v2/missions?status=active&limit=1`, { headers: { cookie }, cache: "no-store" }),
        fetch(`${BASE}/api/assignments?limit=1`, { headers: { cookie }, cache: "no-store" }),
      ]);

      const [studentsData, coursesData, missionsData, assignmentsData] = await Promise.all([
        studentsRes.ok ? studentsRes.json() : Promise.resolve({ total: 0 }),
        coursesRes.ok ? coursesRes.json() : Promise.resolve({ total: 0 }),
        missionsRes.ok ? missionsRes.json() : Promise.resolve({ total: 0, missions: [] }),
        assignmentsRes.ok ? assignmentsRes.json() : Promise.resolve({ total: 0, assignments: [] }),
      ]);

      const totalStudents =
        typeof studentsData?.pagination?.total === 'number'
          ? studentsData.pagination.total
          : typeof studentsData?.total === 'number'
            ? studentsData.total
            : Array.isArray(studentsData?.data)
              ? studentsData.data.length
              : 0;

      const totalCourses =
        typeof coursesData?.pagination?.total === 'number'
          ? coursesData.pagination.total
          : typeof coursesData?.total === 'number'
            ? coursesData.total
            : Array.isArray(coursesData?.data)
              ? coursesData.data.length
              : 0;

      const missionsArray = Array.isArray(missionsData?.data) ? missionsData.data : [];
      const activeMissions = typeof missionsData?.pagination?.total === 'number'
        ? missionsData.pagination.total
        : missionsArray.filter((m: any) => m.status === 'active').length;
      const avgProgress = 67; // Placeholder until a progress API is available

      return { totalStudents, totalCourses, activeMissions, avgProgress };
    } catch {
      return { totalStudents: 0, totalCourses: 0, activeMissions: 0, avgProgress: 0 };
    }
  }

  const { totalStudents, totalCourses, activeMissions, avgProgress } = await getStats();

  const isAdminOrManager = user.role === "admin" || user.role === "manager" || user.role === "developer";
  const isSreOrElevated = user.role === "sre" || user.role === "developer" || user.role === "admin" || user.role === "manager";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">
          You're logged in as a <span className="font-semibold capitalize">{user.role}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Missions</p>
              <p className="text-2xl font-bold text-gray-900">{activeMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{avgProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {isAdminOrManager && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dashboard/admin/students"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">View Students</h3>
                <p className="text-sm text-gray-500">View and manage enrolled students</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/dashboard/admin/missions"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Target className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Mission Management</h3>
                <p className="text-sm text-gray-500">Create and manage learning missions</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/dashboard/admin/courses"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Course Management</h3>
                <p className="text-sm text-gray-500">Manage course offerings and assignments</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        </div>
      )}

      {/* Mission Hub Access */}
      {isAdminOrManager && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Mission Hub</h2>
              <p className="text-gray-600 mb-4">
                Access advanced mission analytics, progress tracking, and performance insights
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/mission-hub"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-900 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  <Target className="h-4 w-4 mr-2 text-gray-600" />
                  Go to Mission Hub
                </Link>
                <Link
                  href="/dashboard/admin/missions"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-900 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  <Target className="h-4 w-4 mr-2 text-gray-600" />
                  Mission Management
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <Target className="h-24 w-24 text-gray-200" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">New student enrolled in Batch 007</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Mission "Web Development Fundamentals" completed</p>
              <p className="text-xs text-gray-500">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">New assignment posted for Course CS101</p>
              <p className="text-xs text-gray-500">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
