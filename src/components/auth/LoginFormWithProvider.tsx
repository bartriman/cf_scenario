import { QueryProvider } from "@/components/QueryProvider";
import { LoginFormNew } from "./LoginFormNew";

interface LoginFormWithProviderProps {
  redirectTo?: string;
  onSuccess?: (redirectUrl?: string) => void;
}

export default function LoginFormWithProvider(props: LoginFormWithProviderProps) {
  return (
    <QueryProvider>
      <LoginFormNew {...props} />
    </QueryProvider>
  );
}
