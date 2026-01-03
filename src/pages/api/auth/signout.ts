import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";

/**
 * POST /api/auth/signout
 *
 * Signs out the current user and clears session
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Step 1: Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Supabase client not available",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to sign out",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Clear all auth-related cookies
    const cookieNames = ["sb-access-token", "sb-refresh-token", "sb-auth-token"];

    cookieNames.forEach((name) => {
      cookies.delete(name, { path: "/" });
    });

    // Step 4: Return success response
    return new Response(JSON.stringify({ message: "Successfully signed out" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during sign out",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;
