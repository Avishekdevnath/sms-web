"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { ToastProvider } from "@/components/shared/ToastContainer";

interface DashboardLayoutShellProps {
  children: React.ReactNode;
  role: string;
}

export function DashboardLayoutShell({ children, role }: DashboardLayoutShellProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ToastProvider>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        <Sidebar 
          user={{ role } as any} 
          sidebarOpen={false} 
          setSidebarOpen={() => {}} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200 z-30">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="relative">
                  <span className="text-sm text-gray-700 font-medium">
                    Role: {role}
                  </span>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
