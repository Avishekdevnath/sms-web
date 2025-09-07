"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import MissionHubSidebar from "./MissionHubSidebar";
import MissionHubHeader from "./MissionHubHeader";

interface MissionHubClientWrapperProps {
  children: React.ReactNode;
  user: any;
}

export default function MissionHubClientWrapper({ children, user }: MissionHubClientWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-white rounded-md shadow-lg border border-gray-200"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Sidebar */}
      <MissionHubSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <MissionHubHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
