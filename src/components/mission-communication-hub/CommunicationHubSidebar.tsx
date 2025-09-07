"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Radio, Megaphone, BookOpen, Code2, Users2, RefreshCw, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchMissions, selectMissions, selectMissionsError, selectMissionsLoading, selectSelectedMission, setSelectedMission } from "@/store/missionHubSlice";

type NavItem = { name: string; href?: string; icon?: React.ReactNode; children?: NavItem[] };

export default function CommunicationHubSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (o: boolean) => void; }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const missions = useAppSelector(selectMissions);
  const selectedMission = useAppSelector(selectSelectedMission);
  const loading = useAppSelector(selectMissionsLoading);
  const error = useAppSelector(selectMissionsError);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    dispatch(fetchMissions());
  }, [dispatch]);
  const isActive = (href: string) => pathname === href;
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Admin Groups", "Mission Groups", "Helpzone", "mentor avishek", "mentor shifat", "mentor adil"]));

  const nav: NavItem[] = [
    { name: "Overview", href: "/mission-communication-hub", icon: <Radio className="w-5 h-5" /> },
    {
      name: "Admin Groups",
      icon: <Radio className="w-5 h-5" />,
      children: [
        { name: "Resources", href: "/mission-communication-hub/admin-groups/resources", icon: <BookOpen className="w-5 h-5" /> },
        { name: "Messaging", href: "/mission-communication-hub/admin-groups/messaging", icon: <Radio className="w-5 h-5" /> },
      ]
    },
    {
      name: "Mission Groups",
      icon: <Users2 className="w-5 h-5" />,
      children: [
        { name: "Announcements", href: "/mission-communication-hub/mission-groups/announcements", icon: <Megaphone className="w-5 h-5" /> },
        { name: "Guideline Session", href: "/mission-communication-hub/mission-groups/guideline", icon: <BookOpen className="w-5 h-5" /> },
        { name: "Resources", href: "/mission-communication-hub/mission-groups/resources", icon: <BookOpen className="w-5 h-5" /> },
      ]
    },
    {
      name: "Helpzone",
      icon: <BookOpen className="w-5 h-5" />,
      children: [
        { name: "Guideline Zone", href: "/mission-communication-hub/helpzone/guideline", icon: <BookOpen className="w-5 h-5" /> },
        { name: "Coding Zone", href: "/mission-communication-hub/helpzone/coding", icon: <Code2 className="w-5 h-5" /> },
      ]
    },
    { name: "Mentorship Groups", href: "/mission-communication-hub/mentorship-groups", icon: <Users2 className="w-5 h-5" /> },
    {
      name: "mentor avishek",
      icon: <Users2 className="w-5 h-5" />,
      children: [
        { name: "announcement channel", href: "/mission-communication-hub/mentorship-groups/avishek/announcements" },
        { name: "discussion channel", href: "/mission-communication-hub/mentorship-groups/avishek/discussion" },
      ]
    },
    {
      name: "mentor shifat",
      icon: <Users2 className="w-5 h-5" />,
      children: [
        { name: "announcement channel", href: "/mission-communication-hub/mentorship-groups/shifat/announcements" },
        { name: "discussion channel", href: "/mission-communication-hub/mentorship-groups/shifat/discussion" },
      ]
    },
    {
      name: "mentor adil",
      icon: <Users2 className="w-5 h-5" />,
      children: [
        { name: "announcement channel", href: "/mission-communication-hub/mentorship-groups/adil/announcements" },
        { name: "discussion channel", href: "/mission-communication-hub/mentorship-groups/adil/discussion" },
      ]
    },
  ];

  const toggle = (key: string) => {
    const next = new Set(expanded);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpanded(next);
  };

  const renderItem = (item: NavItem, level: number) => {
    const padded = level > 0;
    if (item.children) {
      const open = expanded.has(item.name);
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggle(item.name)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:text-black hover:bg-gray-50 ${padded ? 'ml-3' : ''}`}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="text-gray-500">{item.icon}</span>}
              {!collapsed && <span>{item.name}</span>}
            </div>
            {!collapsed && (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>
          {open && (
            !collapsed && (
              <div className="ml-4 space-y-1 border-l border-gray-200 pl-2">
                {item.children.map((c) => (
                  <div key={c.name}>{renderItem(c, level + 1)}</div>
                ))}
              </div>
            )
          )}
        </div>
      );
    }
    return (
      <Link
        href={item.href!}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${item.href && isActive(item.href) ? 'text-black font-medium' : 'text-gray-700 hover:text-black'} ${padded ? 'ml-1' : ''} ${collapsed ? 'justify-center' : ''}`}
      >
        {item.icon && <span className={`${item.href && isActive(item.href) ? 'text-gray-800' : 'text-gray-500'}`}>{item.icon}</span>}
        {!collapsed && item.name}
      </Link>
    );
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/20" />
        </div>
      )}
      <div className={`
        fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-72'} bg-white text-gray-900 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:inset-0 border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center">
            <Radio className="w-6 h-6 text-black mr-3" />
            {!collapsed && <h1 className="text-lg font-semibold text-black">Comm Hub</h1>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:inline-flex p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-4 overflow-y-auto space-y-1`}>
          <div className="mb-3 p-3 border border-gray-200 rounded">
            {!collapsed && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Active Mission</span>
                  <button onClick={() => dispatch(fetchMissions())} disabled={loading} className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {loading ? (
                  <div className="text-xs text-gray-500">Loading…</div>
                ) : error ? (
                  <div className="text-xs text-red-600">{error}</div>
                ) : (
                  <select
                    value={selectedMission?._id || ""}
                    onChange={(e) => {
                      const m = missions.find(x => x._id === e.target.value) || null;
                      dispatch(setSelectedMission(m));
                    }}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg:white"
                  >
                    {missions.map((m) => (
                      <option key={m._id} value={m._id}>{m.code} - {m.title}</option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
          {nav.map((item) => (
            <div key={item.name}>{renderItem(item, 0)}</div>
          ))}
        </nav>
      </div>
    </>
  );
}


