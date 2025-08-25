"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { ArrowLeft, Edit, User, Mail, Phone, GraduationCap, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";

interface StudentProfile {
  _id: string;
  userId: {
    _id: string;
    email: string;
    name: string;
    isActive: boolean;
    profileCompleted: boolean;
  };
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  academicInfo?: {
    previousInstitution?: string;
    graduationYear?: number;
    gpa?: number;
    courseGoal?: string;
  };
  isActive: boolean;
  profileCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  batches?: Array<{
    id: string;
    title: string;
    code: string;
    status: string;
  }>;
  enrollment?: {
    status: string;
    batchId: {
      _id: string;
      title: string;
      code: string;
    };
    invitedAt?: string;
    activatedAt?: string;
  };
}

export default function ViewStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-profiles/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch student profile");
      }
      
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error("Error fetching student profile:", error);
      setError("Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (profile: StudentProfile) => {
    // Check if the user is active (from the nested userId object)
    const isUserActive = profile.userId.isActive;
    const isProfileCompleted = profile.userId.profileCompleted;
    
    if (!isUserActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    if (!isProfileCompleted) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Profile Pending</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || "Student profile not found"}</p>
          <Link
            href="/dashboard/admin/students"
            className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/students"
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">Student Profile</h1>
            <p className="mt-2 text-gray-600">
              View detailed information about {profile.firstName} {profile.lastName}
            </p>
          </div>
        </div>
                 <Link
           href={`/dashboard/admin/students/${id}/edit`}
           className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
         >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6">
            <div className="text-center mb-6">
              {profile.profilePicture ? (
                <img
                  className="h-24 w-24 rounded-full mx-auto mb-4"
                  src={profile.profilePicture}
                  alt={profile.firstName}
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-medium text-gray-700">
                    {getInitials(profile.firstName, profile.lastName)}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600">@{profile.username}</p>
              <div className="mt-2">
                {getStatusBadge(profile)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                                     <p className="text-sm font-medium">{profile.userId.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="text-sm font-medium">{formatDate(profile.createdAt)}</p>
                </div>
              </div>

              {profile.completedAt && (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Profile Completed</p>
                    <p className="text-sm font-medium">{formatDate(profile.completedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {profile.bio && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bio</h3>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          {/* Academic Information */}
          {profile.academicInfo && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Academic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.academicInfo.previousInstitution && (
                  <div>
                    <p className="text-sm text-gray-500">Previous Institution</p>
                    <p className="text-sm font-medium">{profile.academicInfo.previousInstitution}</p>
                  </div>
                )}

                {profile.academicInfo.graduationYear && (
                  <div>
                    <p className="text-sm text-gray-500">Graduation Year</p>
                    <p className="text-sm font-medium">{profile.academicInfo.graduationYear}</p>
                  </div>
                )}

                {profile.academicInfo.gpa && (
                  <div>
                    <p className="text-sm text-gray-500">GPA</p>
                    <p className="text-sm font-medium">{profile.academicInfo.gpa}</p>
                  </div>
                )}
              </div>

              {profile.academicInfo.courseGoal && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Course Goal</p>
                  <p className="text-sm font-medium mt-1">{profile.academicInfo.courseGoal}</p>
                </div>
              )}
            </div>
          )}

          {/* Enrollment Information */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Enrollment Information
            </h3>
            
            {profile.enrollment ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Enrollment Status</p>
                    <p className="text-sm font-medium capitalize">{profile.enrollment.status}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Batch</p>
                    <p className="text-sm font-medium">{profile.enrollment.batchId.code} - {profile.enrollment.batchId.title}</p>
                  </div>

                  {profile.enrollment.invitedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Invited At</p>
                      <p className="text-sm font-medium">{formatDate(profile.enrollment.invitedAt)}</p>
                    </div>
                  )}

                  {profile.enrollment.activatedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Activated At</p>
                      <p className="text-sm font-medium">{formatDate(profile.enrollment.activatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No enrollment information available</p>
            )}
          </div>

          {/* Batch Memberships */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Memberships</h3>
            
            {profile.batches && profile.batches.length > 0 ? (
              <div className="space-y-3">
                {profile.batches.map((batch, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{batch.code} - {batch.title}</p>
                      <p className="text-xs text-gray-500 capitalize">Status: {batch.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No batch memberships found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
