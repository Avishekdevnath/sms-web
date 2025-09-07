import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { MissionProvider } from "@/context/MissionContext";

// Force dynamic rendering for all routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMS Dashboard - Student Management System",
  description: "Comprehensive platform for managing student missions, courses, and academic progress",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <MissionProvider>
            {children}
          </MissionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
