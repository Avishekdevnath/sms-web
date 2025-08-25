"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Mail, Phone, GraduationCap } from "lucide-react";
import Link from "next/link";

interface StudentProfile {
  _id: string;
  userId: string;
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
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    email: "",
    newPassword: "",
    bio: "",
    academicInfo: {
      previousInstitution: "",
      graduationYear: "",
      gpa: "",
      courseGoal: ""
    }
  });

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
      const profile = data.profile;
      
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        username: profile.username || "",
        phone: profile.phone || "",
        email: profile.userId.email || "",
        newPassword: "",
        bio: profile.bio || "",
        academicInfo: {
          previousInstitution: profile.academicInfo?.previousInstitution || "",
          graduationYear: profile.academicInfo?.graduationYear?.toString() || "",
          gpa: profile.academicInfo?.gpa?.toString() || "",
          courseGoal: profile.academicInfo?.courseGoal || ""
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
        email: formData.email,
        bio: formData.bio
      };

      // Only include password if provided
      if (formData.newPassword.trim()) {
        updateData.newPassword = formData.newPassword;
      }

      // Include academic info if any field is filled
      if (Object.values(formData.academicInfo).some(value => value.trim())) {
        updateData.academicInfo = {
          previousInstitution: formData.academicInfo.previousInstitution || undefined,
          graduationYear: formData.academicInfo.graduationYear ? parseInt(formData.academicInfo.graduationYear) : undefined,
          gpa: formData.academicInfo.gpa ? parseFloat(formData.academicInfo.gpa) : undefined,
          courseGoal: formData.academicInfo.courseGoal || undefined
        };
      }

      const response = await fetch(`/api/student-profiles/${id}`, {
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

      setSuccess("Student profile updated successfully!");
      
      // Clear password field
      setFormData(prev => ({ ...prev, newPassword: "" }));
      
      // Redirect back to students list after a delay
      setTimeout(() => {
        router.push("/dashboard/admin/students");
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-3xl font-bold text-black">Edit Student Profile</h1>
            <p className="mt-2 text-gray-600">
              Update student information and credentials
            </p>
          </div>
        </div>
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

      {/* Form */}
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

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Password Change */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Password Change
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters. Leave blank to keep the current password.
              </p>
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
              placeholder="Tell us about the student..."
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
                placeholder="Why did the student enroll in this course?"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Link
              href="/dashboard/admin/students"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
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
    </div>
  );
}
