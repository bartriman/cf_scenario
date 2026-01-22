import { useMutation } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth.service";
import type {
  LoginFormValues,
  RegisterFormValues,
  ForgotPasswordFormValues,
  UpdatePasswordFormValues,
} from "@/lib/validation/auth.validation";

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginFormValues) => authService.login(data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterFormValues) => authService.register(data),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordFormValues) => authService.forgotPassword(data),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordFormValues) => authService.updatePassword(data),
  });
}
