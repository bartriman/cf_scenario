import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth.validation";

describe("auth.validation", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"]);
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["password"]);
      }
    });
  });

  describe("registerSchema", () => {
    it("should validate matching passwords", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        companyName: "Test Company",
      });

      expect(result.success).toBe(true);
    });

    it("should reject non-matching passwords", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different",
        companyName: "Test Company",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path.includes("confirmPassword"));
        expect(passwordError?.message).toBe("Passwords do not match");
      }
    });

    it("should reject short password", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "short",
        confirmPassword: "short",
        companyName: "Test Company",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path.includes("password"));
        expect(passwordError?.message).toContain("at least 8 characters");
      }
    });

    it("should reject empty company name", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        companyName: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const companyError = result.error.issues.find((issue) => issue.path.includes("companyName"));
        expect(companyError?.message).toBe("Company name is required");
      }
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should validate correct email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "not-an-email",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("should validate matching passwords", () => {
      const result = updatePasswordSchema.safeParse({
        password: "newpassword123",
        confirmPassword: "newpassword123",
      });

      expect(result.success).toBe(true);
    });

    it("should reject non-matching passwords", () => {
      const result = updatePasswordSchema.safeParse({
        password: "newpassword123",
        confirmPassword: "different",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });

    it("should reject short password", () => {
      const result = updatePasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      });

      expect(result.success).toBe(false);
    });
  });
});
