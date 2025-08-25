"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Mission {
  _id: string;
  code: string;
  title: string;
  status: string;
  batchId: {
    code: string;
    title: string;
  };
}

interface MissionSelectorProps {
  userRole: string;
  userId: string;
}

export default function MissionSelector({ userRole, userId }: MissionSelectorProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<string>('');

  useEffect(() => {
    fetchMissions();
  }, [userRole, userId]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      
      let url = '/api/missions?limit=50';
      
      // Role-specific mission filtering
      if (userRole === 'student') {
        url = `/api/missions/student/${userId}`;
      } else if (userRole === 'mentor') {
        url = `/api/missions/mentor/${userId}`;
      } else if (userRole === 'developer') {
        url = `/api/missions/developer/${userId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.missions) {
        setMissions(data.missions);
        if (data.missions.length > 0) {
          setSelectedMission(data.missions[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMissionManagementUrl = (missionId: string) => {
    switch (userRole) {
      case 'admin':
        return `/dashboard/admin/missions/${missionId}`;
      case 'manager':
        return `/dashboard/manager/missions/${missionId}`;
      case 'developer':
        return `/dashboard/developer/missions/${missionId}`;
      case 'sre':
        return `/dashboard/sre/missions/${missionId}`;
      case 'mentor':
        return `/dashboard/mentor/missions/${missionId}`;
      case 'student':
        return `/dashboard/student/missions/${missionId}`;
      default:
        return `/dashboard/missions/${missionId}`;
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-xl font-bold text-black mb-4">No Missions Available</h3>
        <p className="text-gray-600">You don't have access to any missions yet.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-xl font-bold text-black mb-6">Mission Management</h3>
      
      {/* Mission Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Mission
        </label>
        <select
          value={selectedMission}
          onChange={(e) => setSelectedMission(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
        >
          {missions.map((mission) => (
            <option key={mission._id} value={mission._id}>
              {mission.code} - {mission.title} ({mission.status})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Mission Actions */}
      {selectedMission && (
        <div className="space-y-3">
          <Link
            href={getMissionManagementUrl(selectedMission)}
            className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
          >
            <span className="font-medium">Manage Mission</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          
          <Link
            href={`${getMissionManagementUrl(selectedMission)}/students`}
            className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
          >
            <span className="font-medium">View Students</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          
          <Link
            href={`${getMissionManagementUrl(selectedMission)}/assignments`}
            className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
          >
            <span className="font-medium">View Assignments</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          
          <Link
            href={`${getMissionManagementUrl(selectedMission)}/progress`}
            className="flex items-center justify-between p-3 border rounded-lg hover:border-black transition-colors"
          >
            <span className="font-medium">View Progress</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      )}
    </div>
  );
}
