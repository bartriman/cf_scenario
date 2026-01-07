import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Hasło musi zawierać co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = updatePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = validationResult.data;

    // Update user password
    const { error } = await locals.supabase.auth.updateUser({
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Link do resetowania hasła wygasł lub jest nieprawidłowy. Spróbuj ponownie.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Hasło zostało zmienione pomyślnie",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Update password error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas zmiany hasła",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
