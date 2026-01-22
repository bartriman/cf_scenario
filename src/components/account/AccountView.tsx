import { useAccountData } from "@/components/hooks/useAccount";
import { UserInfoCard } from "./UserInfoCard";
import { ScenarioStatsCard } from "./ScenarioStatsCard";
import { CompanyListCard } from "./CompanyListCard";
import { ChangePasswordCard } from "./ChangePasswordCard";

export default function AccountView() {
  const { data, isLoading } = useAccountData();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Failed to load account data</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-muted-foreground mt-2">Manage your account and view statistics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserInfoCard email={data.user.email} />
        <ScenarioStatsCard total={data.stats.total} draft={data.stats.draft} locked={data.stats.locked} />
        <CompanyListCard companies={data.companies} />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
