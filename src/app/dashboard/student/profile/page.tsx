"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Edit, User, Mail, Phone, GraduationCap, Calendar, BookOpen, Save } from "lucide-react";
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
  profilePicture?: string;
  bio?: string;
  academicInfo?: {
    previousInstitution?: string;
    graduationYear?: number;
    gpa?: number;
    courseGoal?: string;
  };
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  batches?: Array<{
    id: string;
    title: string;
    code: string;
    status: string;
  }>;
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    bio: "",
    academicInfo: {
      previousInstitution: "",
      graduationYear: "",
      gpa: "",
      courseGoal: ""
    }
  });

  useEffect(() => {
    if (user) {
      fetchStudentProfile();
    }
  }, [user]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-profiles/me`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch student profile");
      }
      
      const data = await response.json();
      setProfile(data.profile);
      
      // Set form data for editing
      setFormData({
        firstName: data.profile.firstName || "",
        lastName: data.profile.lastName || "",
        username: data.profile.username || "",
        phone: data.profile.phone || "",
        bio: data.profile.bio || "",
        academicInfo: {
          previousInstitution: data.profile.academicInfo?.previousInstitution || "",
          graduationYear: data.profile.academicInfo?.graduationYear?.toString() || "",
          gpa: data.profile.academicInfo?.gpa?.toString() || "",
          courseGoal: data.profile.academicInfo?.courseGoal || ""
        }
      });
    } catch (error) {
      console.error("Error fetching student profile:", error);
      setError("Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith("academicInfo.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        academicInfo: {
          ...prev.academicInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        phone: formData.phone,
        bio: formData.bio
      };

      // Include academic info if any field is filled
      if (Object.values(formData.academicInfo).some(value => value.trim())) {
        updateData.academicInfo = {
          previousInstitution: formData.academicInfo.previousInstitution || undefined,
          graduationYear: formData.academicInfo.graduationYear ? parseInt(formData.academicInfo.graduationYear) : undefined,
          gpa: formData.academicInfo.gpa ? parseFloat(formData.academicInfo.gpa) : undefined,
          courseGoal: formData.academicInfo.courseGoal || undefined
        };
      }

      const response = await fetch(`/api/student-profiles/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to update student profile");
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      
      // Refresh profile data
      await fetchStudentProfile();

    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
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
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || "Profile not found"}</p>
          <Link
            href="/dashboard/student"
            className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
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
            href="/dashboard/student"
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">My Profile</h1>
            <p className="mt-2 text-gray-600">
              View and manage your student profile
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

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
          {isEditing ? (
            /* Edit Form */
            <div className="bg-white border rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Academic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Academic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Previous Institution
                      </label>
                      <input
                        type="text"
                        name="academicInfo.previousInstitution"
                        value={formData.academicInfo.previousInstitution}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        name="academicInfo.graduationYear"
                        value={formData.academicInfo.graduationYear}
                        onChange={handleInputChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GPA
                      </label>
                      <input
                        type="number"
                        name="academicInfo.gpa"
                        value={formData.academicInfo.gpa}
                        onChange={handleInputChange}
                        min="0"
                        max="4"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Goal
                    </label>
                    <textarea
                      name="academicInfo.courseGoal"
                      value={formData.academicInfo.courseGoal}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      placeholder="Why did you enroll in this course?"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* View Mode */
            <>
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

              {/* Batch Memberships */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  My Batches
                </h3>
                
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
