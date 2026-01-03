import type { APIRoute } from "astro";
import type { SignUpRequestDTO, SignUpResponseDTO, ErrorResponseDTO } from "../../../types";
import { SignUpSchema } from "../../../lib/validation/auth.validation";
import { z } from "zod";

/**
 * POST /api/auth/signup
 *
 * Registers a new user with email and password
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
    let body: SignUpRequestDTO;
    try {
      const rawBody = await request.json();
      body = SignUpSchema.parse(rawBody);
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

    // Step 3: Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          company_name: body.companyName,
        },
      },
    });

    // Step 4: Handle registration errors
    if (error || !data.user) {
      // Check for specific error types
      if (error?.message.includes("already registered")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "CONFLICT",
            message: "Użytkownik z tym adresem email już istnieje",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to create user account",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Check if session exists (auto-login if email confirmation is disabled)
    if (!data.session) {
      // Email confirmation is required - return success without session
      return new Response(
        JSON.stringify({
          message: "Sprawdź swoją skrzynkę email, aby potwierdzić rejestrację",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Auto-login is enabled - return success response with session
    // Note: Redirect logic is handled client-side via /auth/callback
    const response: SignUpResponseDTO = {
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
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during registration",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;
