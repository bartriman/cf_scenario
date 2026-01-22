import { describe, it, expect, vi, beforeEach } from "vitest";
import { accountService } from "@/lib/services/account.service";

// Mock global fetch
global.fetch = vi.fn();

describe("AccountService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAccountData", () => {
    it("should fetch account data successfully", async () => {
      const mockData = {
        user: { email: "test@example.com" },
        companies: [],
        stats: { total: 0, draft: 0, locked: 0 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await accountService.getAccountData();

      expect(global.fetch).toHaveBeenCalledWith("/api/account");
      expect(result).toEqual(mockData);
    });

    it("should throw error on failed fetch", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(accountService.getAccountData()).rejects.toThrow("Failed to fetch account data");
    });
  });

  describe("changePassword", () => {
    it("should call change-password endpoint and exclude confirmPassword", async () => {
      const mockResponse = { message: "Password changed" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await accountService.changePassword({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "oldpassword",
          newPassword: "newpassword123",
        }),
      });
    });

    it("should throw error with message from API", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "Current password is incorrect" } }),
      });

      await expect(
        accountService.changePassword({
          currentPassword: "wrong",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        })
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should throw generic error when no message in response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        accountService.changePassword({
          currentPassword: "oldpassword",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        })
      ).rejects.toThrow("Failed to change password");
    });
  });
});
