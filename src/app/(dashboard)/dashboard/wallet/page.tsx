import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import WalletContent from "./wallet-content";

export default async function WalletPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  return <WalletContent userId={user.userId} />;
}
