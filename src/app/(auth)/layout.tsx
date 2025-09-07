// Force dynamic rendering for auth routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>{children}</div>
  );
} 