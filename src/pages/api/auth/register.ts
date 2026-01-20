import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  companyName: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password, companyName } = validationResult.data;

    // Create user account
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
        data: {
          company_name: companyName,
        },
      },
    });

    if (error) {
      // Check if email already exists
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "This email address is already registered. Please use the login function.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Note: Company will be created when user imports first data (as per requirement 3.D)
    // User profile will be created automatically via database trigger

    return new Response(
      JSON.stringify({
        user: data.user,
        message: "Account created! Check your email inbox and click the verification link to activate your account. The link is valid for 24 hours.",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred during registration",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
