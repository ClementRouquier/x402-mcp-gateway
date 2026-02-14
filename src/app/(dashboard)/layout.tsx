import { getAuthenticatedUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  return (
    <DashboardShell walletAddress={user?.walletAddress ?? null}>
      {children}
    </DashboardShell>
  );
}
