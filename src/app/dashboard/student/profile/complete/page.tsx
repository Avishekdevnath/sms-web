"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  GraduationCap,
  Linkedin,
  Github,
  Globe,
  Tag
} from "lucide-react";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  profilePicture: string;
  bio: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  academicInfo: {
    previousInstitution: string;
    graduationYear: string;
    gpa: string;
  };
  socialLinks: {
    linkedin: string;
    github: string;
    portfolio: string;
  };
  skills: string;
  interests: string;
}

export default function StudentProfileCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    profilePicture: "",
    bio: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },
    academicInfo: {
      previousInstitution: "",
      graduationYear: "",
      gpa: ""
    },
    socialLinks: {
      linkedin: "",
      github: "",
      portfolio: ""
    },
    skills: "",
    interests: ""
  });

  useEffect(() => {
    // Check if user is logged in and needs to complete profile
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        if (user.profileCompleted) {
          router.push('/dashboard/student');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      router.push('/login');
    }
  };

  const handleInputChange = (field: string, value: string, subField?: string) => {
    if (subField) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field as keyof ProfileFormData],
          [subField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.profilePicture.trim()) newErrors.profilePicture = "Profile picture URL is required";

    // Username format validation
    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Phone validation
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // GPA validation
    if (formData.academicInfo.gpa && (parseFloat(formData.academicInfo.gpa) < 0 || parseFloat(formData.academicInfo.gpa) > 4)) {
      newErrors.gpa = "GPA must be between 0 and 4";
    }

    // Graduation year validation
    if (formData.academicInfo.graduationYear) {
      const year = parseInt(formData.academicInfo.graduationYear);
      const currentYear = new Date().getFullYear();
      if (year < 1950 || year > currentYear + 10) {
        newErrors.graduationYear = "Please enter a valid graduation year";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/students/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          academicInfo: {
            ...formData.academicInfo,
            graduationYear: formData.academicInfo.graduationYear ? parseInt(formData.academicInfo.graduationYear) : undefined,
            gpa: formData.academicInfo.gpa ? parseFloat(formData.academicInfo.gpa) : undefined
          },
          skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
          interests: formData.interests ? formData.interests.split(',').map(s => s.trim()).filter(Boolean) : []
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/student');
        }, 2000);
      } else {
        const error = await response.json();
        if (error.error?.code === 'CONFLICT.DUPLICATE') {
          setErrors({ username: "This username is already taken. Please choose another one." });
        } else {
          setErrors({ general: error.error?.message || "Failed to complete profile. Please try again." });
        }
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile completion...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Profile Completed!</h2>
          <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Please provide the required information to activate your account
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Account Created</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-sm font-medium text-blue-900">Complete Profile</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-gray-500" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Account Active</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-8">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* Required Information Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Required Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Choose a unique username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Only letters, numbers, and underscores allowed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture URL *
                </label>
                <input
                  type="url"
                  value={formData.profilePicture}
                  onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                    errors.profilePicture ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/profile-picture.jpg"
                />
                {errors.profilePicture && (
                  <p className="mt-1 text-sm text-red-600">{errors.profilePicture}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: 500x500 pixels
                </p>
              </div>
            </div>
          </div>

          {/* Optional Information Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-600" />
              Additional Information (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Enter your address"
                />
              </div>

              {/* Emergency Contact */}
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value, 'name')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Contact name"
                  />
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value, 'phone')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Contact phone"
                  />
                  <input
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value, 'relationship')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Relationship"
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Academic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={formData.academicInfo.previousInstitution}
                    onChange={(e) => handleInputChange('academicInfo', e.target.value, 'previousInstitution')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Previous institution"
                  />
                  <input
                    type="number"
                    value={formData.academicInfo.graduationYear}
                    onChange={(e) => handleInputChange('academicInfo', e.target.value, 'graduationYear')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Graduation year"
                    min="1950"
                    max="2030"
                  />
                  <input
                    type="number"
                    value={formData.academicInfo.gpa}
                    onChange={(e) => handleInputChange('academicInfo', e.target.value, 'gpa')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="GPA (0-4)"
                    min="0"
                    max="4"
                    step="0.01"
                  />
                </div>
                {errors.gpa && (
                  <p className="mt-1 text-sm text-red-600">{errors.gpa}</p>
                )}
                {errors.graduationYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Social Links
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={formData.socialLinks.linkedin}
                      onChange={(e) => handleInputChange('socialLinks', e.target.value, 'linkedin')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="LinkedIn profile"
                    />
                  </div>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={formData.socialLinks.github}
                      onChange={(e) => handleInputChange('socialLinks', e.target.value, 'github')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="GitHub profile"
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={formData.socialLinks.portfolio}
                      onChange={(e) => handleInputChange('socialLinks', e.target.value, 'portfolio')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Portfolio website"
                    />
                  </div>
                </div>
              </div>

              {/* Skills and Interests */}
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Skills & Interests
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="JavaScript, React, Node.js"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple skills with commas
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interests
                    </label>
                    <input
                      type="text"
                      value={formData.interests}
                      onChange={(e) => handleInputChange('interests', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Web development, AI, Gaming"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple interests with commas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Complete Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
