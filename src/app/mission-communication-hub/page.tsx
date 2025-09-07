"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Megaphone, BookOpen, Radio, Users2, Code2, MessageCircle } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchStudents,
  fetchMentors,
  fetchGroups,
  selectSelectedMission,
  selectStudents,
  selectMentors,
  selectGroups,
  selectStudentsLoading,
  selectMentorsLoading,
  selectGroupsLoading,
} from "@/store/missionHubSlice";

export default function CommunicationHubHome() {
  const dispatch = useAppDispatch();
  const mission = useAppSelector(selectSelectedMission);
  const students = useAppSelector(selectStudents);
  const mentors = useAppSelector(selectMentors);
  const groups = useAppSelector(selectGroups);
  const loadingStudents = useAppSelector(selectStudentsLoading);
  const loadingMentors = useAppSelector(selectMentorsLoading);
  const loadingGroups = useAppSelector(selectGroupsLoading);

  useEffect(() => {
    if (mission?._id) {
      dispatch(fetchStudents(mission._id));
      dispatch(fetchMentors(mission._id));
      dispatch(fetchGroups(mission._id));
    }
  }, [dispatch, mission?._id]);

  const totalStudentsCount = typeof mission?.totalStudents === 'number' ? mission.totalStudents : (students?.length || 0);
  const totalMentorsCount = typeof mission?.totalMentors === 'number' ? mission.totalMentors : (mentors?.length || 0);
  const totalGroupsCount = typeof mission?.totalGroups === 'number' ? mission.totalGroups : (groups?.length || 0);
  const totalMembers = totalStudentsCount + totalMentorsCount;

  const channels = [
    {
      name: "Announcements (for all)",
      href: "/mission-communication-hub/mission-groups/announcements",
      description: "Broadcast mission-wide updates, schedules, and important notices.",
      icon: <Megaphone className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Guideline Session (for all)",
      href: "/mission-communication-hub/mission-groups/guideline",
      description: "Share mentoring guidelines, session notes, and best practices.",
      icon: <BookOpen className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Resources (for all)",
      href: "/mission-communication-hub/mission-groups/resources",
      description: "Curate and access learning materials, documents, and references.",
      icon: <BookOpen className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Messaging (admins & mentors)",
      href: "/mission-communication-hub/admin-groups/messaging",
      description: "Coordinate among admins and mentors for operations and planning.",
      icon: <Radio className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Resources (admins & mentors)",
      href: "/mission-communication-hub/admin-groups/resources",
      description: "Admin/mentor-only resource repository and internal docs.",
      icon: <BookOpen className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Guideline Zone",
      href: "/mission-communication-hub/helpzone/guideline",
      description: "Get help on mentoring guidelines, policies, and procedures.",
      icon: <BookOpen className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Coding Zone",
      href: "/mission-communication-hub/helpzone/coding",
      description: "Ask coding questions and discuss technical solutions.",
      icon: <Code2 className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Mentorship Groups",
      href: "/mission-communication-hub/mentorship-groups",
      description: "Browse mentor-specific channels (announcements and discussions).",
      icon: <Users2 className="w-5 h-5 text-gray-600" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Mission Overview</h2>
            {mission ? (
              <p className="text-gray-600 mt-1">
                <span className="font-medium">{mission.code}</span> — {mission.title}
              </p>
            ) : (
              <p className="text-gray-600 mt-1">Select a mission from the sidebar to view details.</p>
            )}
          </div>
          <MessageCircle className="w-6 h-6 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-500">Total Members</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {loadingStudents || loadingMentors ? "…" : totalMembers}
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-500">Students</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {loadingStudents ? "…" : totalStudentsCount}
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-500">Mentors</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {loadingMentors ? "…" : totalMentorsCount}
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {loadingGroups ? "Loading groups…" : `${totalGroupsCount} mentorship groups`}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Channels and their purpose</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {channels.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">{c.icon}</div>
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-black">{c.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{c.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


