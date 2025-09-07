import React, { useState, useEffect } from 'react';
import { Mission, Users, Calendar, Target } from 'lucide-react';

interface StudentMission {
  _id: string;
  missionId: {
    _id: string;
    title: string;
    code: string;
    status: string;
  };
  batchId: {
    _id: string;
    code: string;
    title: string;
  };
  status: 'active' | 'completed' | 'failed' | 'dropped';
  progress: number;
  startedAt: string;
  lastActivity: string;
  mentorId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface StudentMissionsListProps {
  studentId: string;
  className?: string;
}

export default function StudentMissionsList({ studentId, className = '' }: StudentMissionsListProps) {
  const [missions, setMissions] = useState<StudentMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentMissions();
    }
  }, [studentId]);

  const fetchStudentMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/student-missions?studentId=${studentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMissions(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to fetch missions');
      }
    } catch (err) {
      setError('Failed to fetch missions');
      console.error('Error fetching student missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'dropped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Target className="w-4 h-4" />;
      case 'completed': return <Mission className="w-4 h-4" />;
      case 'failed': return <Users className="w-4 h-4" />;
      case 'dropped': return <Calendar className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error: {error}
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No missions enrolled yet.
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Mission className="w-5 h-5 mr-2" />
        Enrolled Missions ({missions.length})
      </h3>
      
      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {mission.missionId.title}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {mission.missionId.code}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  Batch: {mission.batchId.code} - {mission.batchId.title}
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}>
                      {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Progress:</span>
                    <span className="font-medium">{mission.progress}%</span>
                  </div>
                  
                  {mission.mentorId && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Mentor:</span>
                      <span className="font-medium">{mission.mentorId.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(mission.status)}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Started: {new Date(mission.startedAt).toLocaleDateString()}</span>
                <span>Last Activity: {new Date(mission.lastActivity).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
