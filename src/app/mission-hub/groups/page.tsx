"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GroupsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to all groups page
    router.push('/mission-hub/groups/all');
  }, [router]);

    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-xs text-gray-600">Redirecting to groups...</p>
      </div>
    </div>
  );
}
