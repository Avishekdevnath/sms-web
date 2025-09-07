"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  Settings, 
  BarChart3, 
  UserCheck,
  Users2,
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";

interface MentorStats {
  totalMentors: number;
  activeMentors: number;
  assignedStudents: number;
  totalGroups: number;
}

export default function MentorsPage() {
  const [stats, setStats] = useState<MentorStats>({
    totalMentors: 0,
    activeMentors: 0,
    assignedStudents: 0,
    totalGroups: 0
  });
  const [loading, setLoading] = useState(true);

  const selectedMission = useAppSelector(state => state.missionHub.selectedMission);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedMission) return;
      
      try {
        setLoading(true);
        
        // Fetch mentor statistics
        const [mentorsResponse, groupsResponse] = await Promise.all([
          fetch(`/api/v2/mission-mentors?missionId=${selectedMission._id}`),
          fetch(`/api/v2/mentorship-groups?missionId=${selectedMission._id}`)
        ]);

        if (mentorsResponse.ok && groupsResponse.ok) {
          const [mentorsData, groupsData] = await Promise.all([
            mentorsResponse.json(),
            groupsResponse.json()
          ]);

          const mentors = mentorsData.success ? mentorsData.data : [];
          const groups = groupsData.success ? groupsData.data : [];

          setStats({
            totalMentors: mentors.length,
            activeMentors: mentors.filter((m: any) => m.status === 'active').length,
            assignedStudents: mentors.reduce((sum: number, m: any) => sum + (m.currentStudents || 0), 0),
            totalGroups: groups.length
          });
        }
      } catch (error) {
        console.error('Failed to fetch mentor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedMission]);

  const quickActions = [
    {
      title: "Assign Mentors",
      description: "Assign mentors to missions and manage roles",
      href: "/mission-hub/mentors/assign",
      icon: <UserPlus className="w-6 h-6" />,
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Assign Students",
      description: "Assign students to mentors or groups",
      href: "/mission-hub/mentors/assign-students",
      icon: <Users className="w-6 h-6" />,
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Manage Groups",
      description: "Create and manage mentorship groups",
      href: "/mission-hub/mentors/groups",
      icon: <Users2 className="w-6 h-6" />,
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "View Analytics",
      description: "Monitor mentor performance and metrics",
      href: "/mission-hub/mentors/analytics",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  const managementPages = [
    {
      title: "Mission Mentors",
      description: "View and manage all mentors assigned to missions",
      href: "/mission-hub/mentors/mission-mentors",
      icon: <UserCheck className="w-5 h-5" />
    }
  ];

  if (!selectedMission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Mission Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a mission from the sidebar to view mentor management options.
            </p>
            <Link
              href="/mission-hub"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mentor Management</h1>
              <p className="text-gray-600 mt-2">
                Manage mentors for <span className="font-semibold">{selectedMission.code} - {selectedMission.title}</span>
              </p>
            </div>
            <Link
              href="/mission-hub/mentors/assign"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign Mentor
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mentors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalMentors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Mentors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.activeMentors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.assignedStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users2 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalGroups}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className={`inline-flex p-3 rounded-lg text-white mb-4 ${action.color}`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Management Pages */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Management Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementPages.map((page, index) => (
              <Link
                key={index}
                href={page.href}
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-gray-200 transition-colors">
                    {page.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
                  {page.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
