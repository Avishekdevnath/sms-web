import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ReduxProvider from "@/providers/ReduxProvider";
import CommunicationHubClientWrapper from "@/components/mission-communication-hub/CommunicationHubClientWrapper";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function getCurrentUser() {
  try {
    const cs = await cookies();
    const cookie = cs.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
    const res = await fetch(`${BASE}/api/auth/me`, { headers: { cookie }, cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) redirect("/login");
      throw new Error("Failed to fetch user");
    }
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error("Authentication error:", error);
    redirect("/login");
  }
}

export default async function CommunicationHubLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!["admin", "sre", "mentor", "student"].includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <ReduxProvider>
      <CommunicationHubClientWrapper user={user}>{children}</CommunicationHubClientWrapper>
    </ReduxProvider>
  );
}


