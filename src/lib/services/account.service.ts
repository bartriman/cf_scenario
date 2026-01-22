import type { ChangePasswordFormValues } from "@/lib/validation/account.validation";

export class AccountService {
  async getAccountData() {
    const response = await fetch("/api/account");

    if (!response.ok) {
      throw new Error("Failed to fetch account data");
    }

    return response.json();
  }

  async changePassword(data: ChangePasswordFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } = data;
    const response = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to change password");
    }

    return response.json();
  }
}

export const accountService = new AccountService();
