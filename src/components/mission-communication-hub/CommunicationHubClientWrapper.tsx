"use client";

import { useState } from "react";
import CommunicationHubSidebar from "./CommunicationHubSidebar";
import CommunicationHubHeader from "./CommunicationHubHeader";

export default function CommunicationHubClientWrapper({ children, user }: { children: React.ReactNode; user: any; }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white rounded-md shadow-lg border border-gray-200">
          <span className="sr-only">Open sidebar</span>
          ☰
        </button>
      </div>
      <CommunicationHubSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-h-0 lg:ml-0">
        <CommunicationHubHeader user={user} />
        <main className="flex-1 min-h-0 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}


