'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  AlertCircle,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import ProfilePicture from '@/components/shared/ProfilePicture';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  profilePicture: string;
  courseGoal: string;
}

export default function ProfileCompletePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    profilePicture: '', // Remove default value, make it truly optional
    courseGoal: ''
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Redirect if already completed profile
    if (user.profileCompleted) {
      console.log('Profile already completed, redirecting to main profile page');
      router.push('/dashboard/student/profile');
      return;
    }
    
    // Only allow students to access this page
    if (user.role !== 'student') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.courseGoal.trim()) {
      setError('Course goal is required');
      return false;
    }
    // Remove profile picture validation - it's now optional
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare form data, handling empty profile picture URL
      const submitData = {
        ...formData,
        profilePicture: formData.profilePicture.trim() || undefined // Send undefined if empty
      };

      console.log('Submitting profile data:', submitData); // Debug log

      const response = await fetch('/api/students/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to complete profile');
      }

      setSuccess('Profile completed successfully! Redirecting to your profile page...');
      
      // Update the user context to reflect profile completion
      // This prevents the authentication loop
      const updatedUser = { ...user, profileCompleted: true };
      
      console.log('Profile completed successfully, will redirect to /dashboard/student/profile in 2 seconds');
      
      // Redirect to main profile page after a delay
      setTimeout(() => {
        console.log('Executing redirect to /dashboard/student/profile now...');
        router.push('/dashboard/student/profile');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Profile Completed!</h2>
          <p className="mt-2 text-gray-600">Redirecting to your profile page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Please provide the required information to activate your account
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Choose a username (min 3 characters)"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture URL (Optional)
              </label>
              <input
                type="url"
                id="profilePicture"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="https://example.com/profile-picture.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use a beautiful default profile picture with your initials
              </p>
              
              {/* Preview of profile picture */}
              <div className="mt-3 flex items-center space-x-3">
                <span className="text-xs text-gray-500">Preview:</span>
                <ProfilePicture
                  src={formData.profilePicture.trim() || undefined}
                  alt="Profile preview"
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  size="md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="courseGoal" className="block text-sm font-medium text-gray-700 mb-1">
                Course Goal *
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <textarea
                  id="courseGoal"
                  name="courseGoal"
                  value={formData.courseGoal}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  placeholder="Describe your course goals and objectives..."
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Completing Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Complete Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
