import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // Authenticate user
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy email lub hasło",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success with redirect URL
    return new Response(
      JSON.stringify({
        user: data.user,
        redirectUrl: "/scenarios",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas logowania",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
