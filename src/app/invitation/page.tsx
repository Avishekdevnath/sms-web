'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function InvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitationValid, setInvitationValid] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Missing token.');
      setLoading(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      // Validate the invitation token with the API
      const response = await fetch(`/api/invitations/validate?token=${token}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Invalid invitation');
      }
      
      const data = await response.json();
      setInvitationValid(true);
      setLoading(false);
    } catch (error) {
      setError('Invalid or expired invitation link.');
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Redirect to login with a special parameter to indicate this is an invited user
    router.push(`/login?invited=true&token=${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Invalid Invitation</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome!</h2>
        <p className="mt-2 text-gray-600">
          You've been invited to join the Student Management System.
        </p>
        <p className="mt-2 text-gray-600">
          Please click continue to set up your account.
        </p>
        <button
          onClick={handleContinue}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Continue to Setup
        </button>
      </div>
    </div>
  );
}
