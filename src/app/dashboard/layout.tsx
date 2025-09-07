// Force dynamic rendering for dashboard routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayoutShell } from "./components/DashboardLayoutShell";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function getCurrentUser() {
  try {
    const cs = await cookies();
    const cookie = cs.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
    const res = await fetch(`${BASE}/api/auth/me`, { headers: { cookie }, cache: "no-store" });
    
    if (!res.ok) {
      if (res.status === 401) {
        // User is not authenticated, redirect to login
        redirect("/login");
      }
      throw new Error(`Failed to fetch user: ${res.status}`);
    }
    
    const data = await res.json();
    if (!data.user) {
      throw new Error("No user data in response");
    }
    return data.user;
  } catch (error) {
    console.error("Authentication error:", error);
    // Only redirect to login if it's an authentication error, not a network error
    if (error instanceof Error && error.message.includes("401")) {
      redirect("/login");
    }
    // For other errors, throw to be handled by the layout
    throw error;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await getCurrentUser();
    
    // Redirect students based on their status
    if (user.role === "student") {
      if (user.passwordExpiresAt || user.mustChangePassword) {
        // Student has temporary password or must change password, redirect to change password
        redirect("/change-password");
      }
      // Note: Profile completion is now handled by the login page redirect
      // Students with incomplete profiles will be redirected to /profile-complete before reaching dashboard
    }

    return <DashboardLayoutShell role={user.role}>{children}</DashboardLayoutShell>;
  } catch (error) {
    console.error("Dashboard layout authentication error:", error);
    // If authentication fails, redirect to login
    redirect("/login");
  }
}
