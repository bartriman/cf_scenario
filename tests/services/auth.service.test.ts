import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/lib/services/auth.service";

// Mock global fetch
global.fetch = vi.fn();

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should call login endpoint with correct data", async () => {
      const mockResponse = { redirectUrl: "/scenarios" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });

      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failed login", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid credentials" }),
      });

      await expect(
        authService.login({
          email: "test@example.com",
          password: "wrong",
        })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("register", () => {
    it("should call register endpoint and exclude confirmPassword", async () => {
      const mockResponse = { message: "Success" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authService.register({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        companyName: "Test Company",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          companyName: "Test Company",
        }),
      });
    });

    it("should throw error on failed registration", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Email already exists" }),
      });

      await expect(
        authService.register({
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
          companyName: "Test Company",
        })
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("forgotPassword", () => {
    it("should call forgot-password endpoint", async () => {
      const mockResponse = { message: "Email sent" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authService.forgotPassword({ email: "test@example.com" });

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      });
    });
  });

  describe("updatePassword", () => {
    it("should call update-password endpoint and exclude confirmPassword", async () => {
      const mockResponse = { message: "Password updated" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authService.updatePassword({
        password: "newpassword123",
        confirmPassword: "newpassword123",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "newpassword123" }),
      });
    });
  });
});
