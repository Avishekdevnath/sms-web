"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown, ChevronRight, LayoutDashboard, Users, UserCog, BookOpen, Layers, Boxes, CalendarDays, ClipboardList, Target, BarChart3, Mail, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
}

export default function Sidebar({ user, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  // Role-specific navigation
  const getNavigationByRole = (role: string): NavigationItem[] => {
    switch (role) {
      case 'admin':
        return [
          { name: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
          { 
            name: "Students", 
            href: "/dashboard/admin/students",
            icon: <Users className="h-4 w-4" />,
            children: [
              { name: "All Students", href: "/dashboard/admin/students", icon: <Users className="h-4 w-4" /> },
              { name: "Student Enrollment", href: "/dashboard/admin/students/enroll", icon: <Users className="h-4 w-4" /> },
              { name: "Invitations", href: "/dashboard/admin/students/invite", icon: <Users className="h-4 w-4" /> },
              { name: "Expired Passwords", href: "/dashboard/admin/students/expired-passwords", icon: <Users className="h-4 w-4" /> },
            ]
          },
          { name: "Moderators", href: "/dashboard/admin/users", icon: <UserCog className="h-4 w-4" /> },
          { name: "Courses", href: "/dashboard/admin/courses", icon: <BookOpen className="h-4 w-4" /> },
          { name: "Course Offerings", href: "/dashboard/admin/course-offerings", icon: <Layers className="h-4 w-4" /> },
          { name: "Batches", href: "/dashboard/admin/batches", icon: <Boxes className="h-4 w-4" /> },
          { name: "Semesters", href: "/dashboard/admin/semesters", icon: <CalendarDays className="h-4 w-4" /> },
          { 
            name: "Assignments", 
            href: "/dashboard/admin/assignments",
            icon: <ClipboardList className="h-4 w-4" />,
            children: [
              { name: "All", href: "/dashboard/admin/assignments", icon: <ClipboardList className="h-4 w-4" /> },
              { name: "Create Assignment", href: "/dashboard/admin/assignments/create", icon: <ClipboardList className="h-4 w-4" /> },
              { name: "Email Submissions", href: "/dashboard/admin/assignments", icon: <ClipboardList className="h-4 w-4" /> },
            ]
          },
          { name: "Missions", href: "/dashboard/admin/missions", icon: <Target className="h-4 w-4" /> },
          { name: "Analytics", href: "/dashboard/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
          { name: "Email", href: "/dashboard/admin/email", icon: <Mail className="h-4 w-4" /> },
          { name: "Settings", href: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
        ];
      
      case 'manager':
        return [
          { name: "Dashboard", href: "/dashboard/manager", icon: <LayoutDashboard className="h-4 w-4" /> },
          { 
            name: "Students", 
            href: "/dashboard/admin/students",
            icon: <Users className="h-4 w-4" />,
            children: [
              { name: "All Students", href: "/dashboard/admin/students", icon: <Users className="h-4 w-4" /> },
              { name: "Student Enrollment", href: "/dashboard/admin/students/enroll", icon: <Users className="h-4 w-4" /> },
              { name: "Invitations", href: "/dashboard/admin/students/invite", icon: <Users className="h-4 w-4" /> },
              { name: "Expired Passwords", href: "/dashboard/admin/students/expired-passwords", icon: <Users className="h-4 w-4" /> },
            ]
          },
          { name: "Courses", href: "/dashboard/manager/courses", icon: <BookOpen className="h-4 w-4" /> },
          { name: "Course Offerings", href: "/dashboard/manager/course-offerings", icon: <Layers className="h-4 w-4" /> },
          { name: "Batches", href: "/dashboard/manager/batches", icon: <Boxes className="h-4 w-4" /> },
          { name: "Missions", href: "/dashboard/manager/missions", icon: <Target className="h-4 w-4" /> },
          { 
            name: "Assignments", 
            href: "/dashboard/admin/assignments",
            icon: <ClipboardList className="h-4 w-4" />,
            children: [
              { name: "All", href: "/dashboard/admin/assignments", icon: <ClipboardList className="h-4 w-4" /> },
              { name: "Create Assignment", href: "/dashboard/admin/assignments/create", icon: <ClipboardList className="h-4 w-4" /> },
              { name: "Email Submissions", href: "/dashboard/admin/assignments", icon: <ClipboardList className="h-4 w-4" /> },
            ]
          },
          { name: "Analytics", href: "/dashboard/manager/analytics", icon: <BarChart3 className="h-4 w-4" /> },
        ];
      
      case 'developer':
        return [
          { name: "Dashboard", href: "/dashboard/developer", icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: "Missions", href: "/dashboard/developer/missions", icon: <Target className="h-4 w-4" /> },
          { name: "Assignments", href: "/dashboard/developer/assignments", icon: <ClipboardList className="h-4 w-4" /> },
          { name: "Projects", href: "/dashboard/developer/projects", icon: <Layers className="h-4 w-4" /> },
        ];
      
      case 'sre':
        return [
          { name: "Dashboard", href: "/dashboard/sre", icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: "System Status", href: "/dashboard/sre/status", icon: <BarChart3 className="h-4 w-4" /> },
          { name: "Call Logs", href: "/dashboard/sre/calls", icon: <Mail className="h-4 w-4" /> },
          { name: "Students", href: "/dashboard/sre/students", icon: <Users className="h-4 w-4" /> },
          { name: "Missions", href: "/dashboard/sre/missions", icon: <Target className="h-4 w-4" /> },
          { 
            name: "Assignments", 
            href: "/dashboard/admin/assignments",
            icon: <ClipboardList className="h-4 w-4" />,
            children: [
              { name: "All", href: "/dashboard/admin/assignments", icon: <ClipboardList className="h-4 w-4" /> },
              { name: "Email Submissions", href: "/dashboard/admin/assignments", icon: <ClipboardList className="h-4 w-4" /> },
            ]
          },
          { name: "Expired Passwords", href: "/dashboard/admin/students/expired-passwords", icon: <Users className="h-4 w-4" /> },
        ];
      
      case 'mentor':
        return [
          { name: "Dashboard", href: "/dashboard/mentor", icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: "My Students", href: "/dashboard/mentor/students", icon: <Users className="h-4 w-4" /> },
          { name: "Missions", href: "/dashboard/mentor/missions", icon: <Target className="h-4 w-4" /> },
          { name: "Assignments", href: "/dashboard/mentor/assignments", icon: <ClipboardList className="h-4 w-4" /> },
          { name: "Progress Reports", href: "/dashboard/mentor/progress", icon: <BarChart3 className="h-4 w-4" /> },
        ];
      
      case 'student':
        return [
          { name: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: "My Courses", href: "/dashboard/student/courses", icon: <BookOpen className="h-4 w-4" /> },
          { name: "My Missions", href: "/dashboard/student/missions", icon: <Target className="h-4 w-4" /> },
          { name: "Assignments", href: "/dashboard/student/assignments", icon: <ClipboardList className="h-4 w-4" /> },
          { name: "Progress", href: "/dashboard/student/progress", icon: <BarChart3 className="h-4 w-4" /> },
          { name: "Profile", href: "/dashboard/student/profile", icon: <Users className="h-4 w-4" /> },
        ];
      
      default:
        return [];
    }
  };

  const navigation = getNavigationByRole(user?.role || '');
  
  const isActive = (href: string) => {
    // For dashboard links, only show as active if it's exactly the dashboard page
    if (href.endsWith('/admin') || href.endsWith('/manager') || href.endsWith('/developer') || href.endsWith('/sre') || href.endsWith('/mentor') || href.endsWith('/student')) {
      return pathname === href;
    }
    
    // For parent navigation items with children, NEVER show as active
    // This prevents the clash between parent and child highlighting
    // Note: Student management pages have been simplified to enrollment only
    
    // For all other links, use exact match to ensure only one is highlighted
    return pathname === href;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);
    
    return (
      <div key={item.name}>
        <div className="flex items-center justify-between">
          <Link
            href={item.href}
            className={`
              flex-1 block px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2
              ${active 
                ? 'bg-black text-white' 
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
              }
              ${level > 0 ? 'ml-4' : ''}
              ${collapsed ? 'justify-center' : ''}
            `}
            onClick={() => setSidebarOpen(false)}
          >
            {item.icon && (
              <span className={`${active ? 'text-white' : 'text-gray-500'}`}>{item.icon}</span>
            )}
            {!collapsed && <span>{item.name}</span>}
          </Link>
          
          {hasChildren && !collapsed && (
            <button
              onClick={() => toggleExpanded(item.name)}
              className="p-1 text-gray-500 hover:text-black"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-64'} bg-white text-black transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:inset-0 border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <h1 className={`text-xl font-bold text-black ${collapsed ? 'hidden' : ''}`}>SMS</h1>
          {collapsed && <span className="text-lg font-bold">S</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md text-gray-600 hover:text-black hover:bg-gray-100"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-6 overflow-y-auto`}> 
          <div className="space-y-1">
            {navigation.map((item) => renderNavigationItem(item))}
          </div>
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.role || 'user'}
                </p>
              </div>
            )}
            <button className="p-2 text-gray-600 hover:text-black">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
