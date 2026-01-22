import { QueryProvider } from "@/components/QueryProvider";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default function UpdatePasswordFormWithProvider() {
  return (
    <QueryProvider>
      <UpdatePasswordForm />
    </QueryProvider>
  );
}
