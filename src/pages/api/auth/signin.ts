import type { APIRoute } from "astro";
import type { SignInRequestDTO, SignInResponseDTO, ErrorResponseDTO, UserProfileResponseDTO } from "../../../types";
import { SignInSchema } from "../../../lib/validation/auth.validation";
import { z } from "zod";

/**
 * POST /api/auth/signin
 *
 * Authenticates user with email and password
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    // Step 1: Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Nieprawidłowy email lub hasło",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse and validate request body
    let body: SignInRequestDTO;
    try {
      const rawBody = await request.json();
      body = SignInSchema.parse(rawBody);
    } catch (error) {
      // Unified error message for security
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Nieprawidłowy email lub hasło",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    // Step 4: Handle authentication errors - unified message
    if (error || !data.user || !data.session) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Nieprawidłowy email lub hasło",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Redirect to home page (dashboard)
    const redirectUrl = "/";

    // Step 6: Return success response with redirect URL
    const response: SignInResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      redirect_url: redirectUrl,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sign in error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Nieprawidłowy email lub hasło",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;
