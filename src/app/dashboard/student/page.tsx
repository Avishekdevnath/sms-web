"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  BookOpen, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Users,
  Award,
  TrendingUp
} from "lucide-react";

interface StudentProfile {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  profilePicture: string;
  bio?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  academicInfo?: {
    previousInstitution?: string;
    graduationYear?: number;
    gpa?: number;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  skills?: string[];
  interests?: string[];
  completedAt?: string;
}

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  profileCompleted: boolean;
  invitedAt?: string;
}

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
}

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  submitted: boolean;
  points?: number;
  courseId: {
    _id: string;
    title: string;
    code: string;
  };
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      // Check if user is logged in
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        router.push('/login');
        return;
      }

      const userData = await userResponse.json();
      setUser(userData);

      // Check if profile is completed
      if (!userData.profileCompleted) {
        router.push('/profile-complete');
        return;
      }

      // Load student profile
      const profileResponse = await fetch('/api/students/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.data);
      }

      // Load courses and assignments
      await Promise.all([
        loadCourses(),
        loadAssignments()
      ]);

    } catch (error) {
      console.error('Error loading student data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/students/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/assignments?studentId=me');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const getUpcomingAssignments = () => {
    const now = new Date();
    return assignments
      .filter(assignment => !assignment.submitted && assignment.dueDate)
      .filter(assignment => new Date(assignment.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  };

  const getOverdueAssignments = () => {
    const now = new Date();
    return assignments
      .filter(assignment => !assignment.submitted && assignment.dueDate)
      .filter(assignment => new Date(assignment.dueDate) < now);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Profile Not Found</h2>
          <p className="mt-2 text-gray-600">Please complete your profile first.</p>
          <button
            onClick={() => router.push('/profile-complete')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Welcome back, {profile.firstName}!</h1>
          <p className="mt-2 text-gray-600">Here's what's happening with your studies today.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Assignments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => a.submitted).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => !a.submitted).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.reduce((sum, a) => sum + (a.points || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Assignments */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Assignments</h3>
              </div>
              <div className="p-6">
                {getUpcomingAssignments().length > 0 ? (
                  <div className="space-y-4">
                    {getUpcomingAssignments().map((assignment) => (
                      <div key={assignment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">{assignment.courseId.title}</p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(assignment.dueDate!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-600">No upcoming assignments!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Courses */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Courses</h3>
              </div>
              <div className="p-6">
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => (
                      <div key={course._id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{course.title}</h4>
                            <p className="text-sm text-gray-600">{course.code}</p>
                            {course.description && (
                              <p className="text-xs text-gray-500 mt-1">{course.description}</p>
                            )}
                          </div>
                          <BookOpen className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="mt-2 text-sm text-gray-600">No courses enrolled yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Student Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    {profile.profilePicture ? (
                      <img 
                        src={profile.profilePicture} 
                        alt="Profile" 
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">@{profile.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="mt-4 text-sm text-gray-600">{profile.bio}</p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Student ID:</span>
                    <span className="font-medium text-gray-900">{user.userId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{profile.phone}</span>
                  </div>
                  {profile.academicInfo?.gpa && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">GPA:</span>
                      <span className="font-medium text-gray-900">{profile.academicInfo.gpa}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">View Assignments</span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Course Materials</span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Edit Profile</span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Overdue Alerts */}
            {getOverdueAssignments().length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Overdue Assignments</h3>
                    <p className="mt-1 text-sm text-red-700">
                      You have {getOverdueAssignments().length} overdue assignment(s).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
