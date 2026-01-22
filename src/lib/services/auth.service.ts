import type {
  LoginFormValues,
  RegisterFormValues,
  ForgotPasswordFormValues,
  UpdatePasswordFormValues,
} from "@/lib/validation/auth.validation";

export class AuthService {
  async login(data: LoginFormValues) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    return response.json();
  }

  async register(data: RegisterFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } = data;
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    return response.json();
  }

  async forgotPassword(data: ForgotPasswordFormValues) {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send reset link");
    }

    return response.json();
  }

  async updatePassword(data: UpdatePasswordFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } = data;
    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update password");
    }

    return response.json();
  }
}

export const authService = new AuthService();
