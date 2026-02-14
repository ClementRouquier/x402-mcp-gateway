import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isTokenExpired } from "@/lib/oauth/tokens";
import { ChatDashboard } from "./chat-dashboard";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  let isConnected = false;
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        bitrefillAccessToken: true,
        bitrefillTokenExpiry: true,
      },
    });
    isConnected = !!dbUser?.bitrefillAccessToken && !isTokenExpired(dbUser.bitrefillTokenExpiry);
  }

  return <ChatDashboard isConnected={isConnected} />;
}
