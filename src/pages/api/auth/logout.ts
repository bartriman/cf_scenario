import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Wystąpił błąd podczas wylogowywania",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Wylogowano pomyślnie",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wylogowywania",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
