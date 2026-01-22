import { QueryProvider } from "@/components/QueryProvider";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordFormWithProvider() {
  return (
    <QueryProvider>
      <ForgotPasswordForm />
    </QueryProvider>
  );
}
