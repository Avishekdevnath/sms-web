"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
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
  children?: NavigationItem[];
}

export default function Sidebar({ user, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
          { name: "Dashboard", href: "/dashboard/admin" },
          { 
            name: "Student Management", 
            href: "/dashboard/admin/students",
            children: [
              { name: "All Students", href: "/dashboard/admin/students" },
              { name: "Student Enrollment", href: "/dashboard/admin/students/enroll" },
              { name: "Invitation Management", href: "/dashboard/admin/students/invite" },
              { name: "Expired Passwords", href: "/dashboard/admin/students/expired-passwords" },
            ]
          },
          { name: "Courses", href: "/dashboard/admin/courses" },
          { name: "Course Offerings", href: "/dashboard/admin/course-offerings" },
          { name: "Batches", href: "/dashboard/admin/batches" },
          { name: "Semesters", href: "/dashboard/admin/semesters" },
          { name: "Assignments", href: "/dashboard/admin/assignments" },
          { name: "Missions", href: "/dashboard/admin/missions" },
          { name: "Analytics", href: "/dashboard/admin/analytics" },
          { name: "Email", href: "/dashboard/admin/email" },
          { name: "Settings", href: "/dashboard/admin/settings" },
        ];
      
      case 'manager':
        return [
          { name: "Dashboard", href: "/dashboard/manager" },
          { 
            name: "Student Management", 
            href: "/dashboard/admin/students",
            children: [
              { name: "All Students", href: "/dashboard/admin/students" },
              { name: "Student Enrollment", href: "/dashboard/admin/students/enroll" },
              { name: "Invitation Management", href: "/dashboard/admin/students/invite" },
              { name: "Expired Passwords", href: "/dashboard/admin/students/expired-passwords" },
            ]
          },
          { name: "Courses", href: "/dashboard/manager/courses" },
          { name: "Course Offerings", href: "/dashboard/manager/course-offerings" },
          { name: "Batches", href: "/dashboard/manager/batches" },
          { name: "Missions", href: "/dashboard/manager/missions" },
          { name: "Assignments", href: "/dashboard/manager/assignments" },
          { name: "Analytics", href: "/dashboard/manager/analytics" },
        ];
      
      case 'developer':
        return [
          { name: "Dashboard", href: "/dashboard/developer" },
          { name: "Missions", href: "/dashboard/developer/missions" },
          { name: "Assignments", href: "/dashboard/developer/assignments" },
          { name: "Projects", href: "/dashboard/developer/projects" },
        ];
      
      case 'sre':
        return [
          { name: "Dashboard", href: "/dashboard/sre" },
          { name: "System Status", href: "/dashboard/sre/status" },
          { name: "Call Logs", href: "/dashboard/sre/calls" },
          { name: "Students", href: "/dashboard/sre/students" },
          { name: "Missions", href: "/dashboard/sre/missions" },
          { name: "Expired Passwords", href: "/dashboard/admin/students/expired-passwords" },
        ];
      
      case 'mentor':
        return [
          { name: "Dashboard", href: "/dashboard/mentor" },
          { name: "My Students", href: "/dashboard/mentor/students" },
          { name: "Missions", href: "/dashboard/mentor/missions" },
          { name: "Assignments", href: "/dashboard/mentor/assignments" },
          { name: "Progress Reports", href: "/dashboard/mentor/progress" },
        ];
      
      case 'student':
        return [
          { name: "Dashboard", href: "/dashboard/student" },
          { name: "My Courses", href: "/dashboard/student/courses" },
          { name: "My Missions", href: "/dashboard/student/missions" },
          { name: "Assignments", href: "/dashboard/student/assignments" },
          { name: "Progress", href: "/dashboard/student/progress" },
          { name: "Profile", href: "/dashboard/student/profile" },
          { name: "Complete Profile", href: "/dashboard/student/profile/complete" },
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
              flex-1 block px-3 py-2 text-sm font-medium rounded-md transition-colors
              ${active 
                ? 'bg-black text-white' 
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
              }
              ${level > 0 ? 'ml-4' : ''}
            `}
            onClick={() => setSidebarOpen(false)}
          >
            {item.name}
          </Link>
          
          {hasChildren && (
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
        {hasChildren && isExpanded && (
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white text-black transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:inset-0 border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <h1 className="text-xl font-bold text-black">SMS</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => renderNavigationItem(item))}
          </div>
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role || 'user'}
              </p>
            </div>
            <button className="p-2 text-gray-600 hover:text-black">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
