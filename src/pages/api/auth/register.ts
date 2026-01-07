import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z
    .string()
    .min(8, "Hasło musi zawierać co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
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
            error: "Ten adres email jest już zarejestrowany. Użyj funkcji logowania.",
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
        message: "Konto zostało utworzone! Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny, aby aktywować konto. Link jest ważny przez 24 godziny.",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
