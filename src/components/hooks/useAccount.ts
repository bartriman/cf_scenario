import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/lib/services/account.service";
import type { ChangePasswordFormValues } from "@/lib/validation/account.validation";

export function useAccountData() {
  return useQuery({
    queryKey: ["account"],
    queryFn: () => accountService.getAccountData(),
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangePasswordFormValues) => accountService.changePassword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}
