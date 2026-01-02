import type { APIRoute } from "astro";
import type { SignInRequestDTO, SignInResponseDTO, ErrorResponseDTO } from "../../../types";
import { SignInSchema } from "../../../lib/validation/auth.validation";
import { z } from "zod";

/**
 * POST /api/auth/signin
 *
 * Authenticates user with email and password
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Step 2: Parse and validate request body
    let body: SignInRequestDTO;
    try {
      const rawBody = await request.json();
      body = SignInSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    // Step 4: Handle authentication errors
    if (error || !data.user || !data.session) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: error?.message || "Nieprawidłowy email lub hasło",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Set session cookies (Supabase handles this automatically)
    // The session is automatically stored in cookies by Supabase client

    // Step 6: Return success response
    const response: SignInResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sign in error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during sign in",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;
