import { QueryProvider } from "@/components/QueryProvider";
import { RegisterForm } from "./RegisterForm";

export default function RegisterFormWithProvider() {
  return (
    <QueryProvider>
      <RegisterForm />
    </QueryProvider>
  );
}
