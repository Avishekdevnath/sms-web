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
      throw new Error("Failed to fetch user");
    }
    
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error("Authentication error:", error);
    // If there's any error, redirect to login
    redirect("/login");
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  
  // Redirect students to profile completion if they need to change password or haven't completed profile
  if (user.role === "student" && (user.mustChangePassword || !user.profileCompleted)) {
    redirect("/profile-complete");
  }

  return <DashboardLayoutShell role={user.role}>{children}</DashboardLayoutShell>;
}
