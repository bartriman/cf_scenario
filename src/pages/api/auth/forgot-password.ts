import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email } = validationResult.data;

    // Send password reset email
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/update-password`,
    });

    // Always return success to prevent email enumeration
    // Even if there's an error, we don't want to reveal if the email exists
    if (error) {
      console.error("Password reset error:", error);
    }

    return new Response(
      JSON.stringify({
        message: "If the provided email address exists in the system, we have sent a password reset link.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return success to prevent enumeration
    return new Response(
      JSON.stringify({
        message: "If the provided email address exists in the system, we have sent a password reset link.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};
