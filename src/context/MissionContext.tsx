"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MissionV2 {
  _id: string;
  code: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  maxStudents?: number;
  totalStudents?: number;
  totalMentors?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  batchId?: {
    _id: string;
    code: string;
    title: string;
  };
  courses?: Array<{
    courseOfferingId: {
      _id: string;
      courseId: {
        code: string;
        title: string;
      };
    };
    weight: number;
    minProgress: number;
  }>;
  requirements?: string[];
  rewards?: string[];
  createdAt: string | Date;
}

interface MissionContextType {
  selectedMission: MissionV2 | null;
  setSelectedMission: (mission: MissionV2 | null) => void;
  availableMissions: MissionV2[];
  setAvailableMissions: (missions: MissionV2[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  refreshMissions: () => Promise<void>;
  error: string | null;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export function useMissionContext() {
  const context = useContext(MissionContext);
  if (context === undefined) {
    throw new Error('useMissionContext must be used within a MissionProvider');
  }
  return context;
}

interface MissionProviderProps {
  children: ReactNode;
}

export function MissionProvider({ children }: MissionProviderProps) {
  const [selectedMission, setSelectedMission] = useState<MissionV2 | null>(null);
  const [availableMissions, setAvailableMissions] = useState<MissionV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMissions = async () => {
    try {
      console.log('🔄 Refreshing missions...');
      setLoading(true);
      setError(null);
      
      // Fetch available missions based on user role
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log('👤 User data:', userData.user.role);
      
      if (userData.user.role === "student") {
        // For students, fetch their enrolled missions
        console.log('📚 Fetching student missions...');
        const missionsResponse = await fetch('/api/mission-hub/student-missions');
        if (missionsResponse.ok) {
          const missionsData = await missionsResponse.json();
          console.log('📚 Student missions response:', missionsData);
          if (missionsData.success && missionsData.data?.missions) {
            setAvailableMissions(missionsData.data.missions);
            // Auto-select first mission if none selected
            if (!selectedMission && missionsData.data.missions.length > 0) {
              setSelectedMission(missionsData.data.missions[0]);
            }
          } else {
            console.log('📚 No student missions found');
            setAvailableMissions([]);
          }
        } else {
          throw new Error(`Failed to fetch student missions: ${missionsResponse.status}`);
        }
      } else {
        // For admin/SRE/mentor, fetch all missions
        console.log('🔧 Fetching admin missions...');
        const missionsResponse = await fetch('/api/v2/missions');
        if (missionsResponse.ok) {
          const missionsData = await missionsResponse.json();
          console.log('🔧 Admin missions response:', missionsData);
          if (missionsData.success && missionsData.data) {
            const transformedMissions = missionsData.data.map((mission: any) => ({
              _id: mission._id,
              code: mission.code,
              title: mission.title,
              description: mission.description,
              status: mission.status,
              maxStudents: mission.maxStudents,
              totalStudents: mission.totalStudents || 0,
              totalMentors: mission.totalMentors || 0,
              startDate: mission.startDate,
              endDate: mission.endDate,
              batchId: mission.batchId,
              courses: mission.courses,
              requirements: mission.requirements,
              rewards: mission.rewards,
              createdAt: mission.createdAt
            }));
            
            console.log('🔧 Transformed missions:', transformedMissions);
            setAvailableMissions(transformedMissions);
            // Auto-select first mission if none selected
            if (!selectedMission && transformedMissions.length > 0) {
              setSelectedMission(transformedMissions[0]);
            }
          } else {
            console.log('🔧 No admin missions found');
            setAvailableMissions([]);
          }
        } else {
          throw new Error(`Failed to fetch admin missions: ${missionsResponse.status}`);
        }
      }
      
      console.log('✅ Missions refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh missions:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setAvailableMissions([]);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  // Load selected mission from localStorage on mount
  useEffect(() => {
    console.log('📱 Loading saved mission from localStorage...');
    const savedMission = localStorage.getItem('selectedMission');
    if (savedMission) {
      try {
        const parsed = JSON.parse(savedMission);
        console.log('📱 Loaded saved mission:', parsed);
        setSelectedMission(parsed);
      } catch (error) {
        console.error('❌ Failed to parse saved mission:', error);
        localStorage.removeItem('selectedMission'); // Clear invalid data
      }
    }
  }, []);

  // Initial mission fetch
  useEffect(() => {
    console.log('🚀 Initial mission fetch...');
    refreshMissions();
  }, []);

  // Persist selected mission to localStorage
  useEffect(() => {
    if (selectedMission) {
      console.log('💾 Saving mission to localStorage:', selectedMission);
      localStorage.setItem('selectedMission', JSON.stringify(selectedMission));
    }
  }, [selectedMission]);

  const value: MissionContextType = {
    selectedMission,
    setSelectedMission,
    availableMissions,
    setAvailableMissions,
    loading,
    setLoading,
    refreshMissions,
    error
  };

  return (
    <MissionContext.Provider value={value}>
      {children}
    </MissionContext.Provider>
  );
}
