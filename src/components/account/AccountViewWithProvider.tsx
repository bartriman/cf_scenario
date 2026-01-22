import { QueryProvider } from "@/components/QueryProvider";
import AccountView from "./AccountView";

export default function AccountViewWithProvider() {
  return (
    <QueryProvider>
      <AccountView />
    </QueryProvider>
  );
}
