import { describe, it, expect } from "vitest";
import { changePasswordSchema } from "@/lib/validation/account.validation";

describe("account.validation", () => {
  describe("changePasswordSchema", () => {
    it("should validate correct password change data", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });

      expect(result.success).toBe(true);
    });

    it("should reject non-matching passwords", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
        confirmPassword: "different",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path.includes("confirmPassword"));
        expect(passwordError?.message).toBe("New passwords do not match");
      }
    });

    it("should reject short new password", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "short",
        confirmPassword: "short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path.includes("newPassword"));
        expect(passwordError?.message).toContain("at least 8 characters");
      }
    });

    it("should reject empty current password", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const currentPasswordError = result.error.issues.find((issue) => issue.path.includes("currentPassword"));
        expect(currentPasswordError?.message).toBe("Current password is required");
      }
    });
  });
});
