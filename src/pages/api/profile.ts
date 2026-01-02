import type { APIRoute } from "astro";
import type { UserProfileResponseDTO, ErrorResponseDTO, UserCompanyDTO } from "../../types";

/**
 * GET /api/profile
 *
 * Returns the authenticated user's profile with company memberships
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // Step 2: Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, default_company_id, created_at")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "NOT_FOUND",
          message: "User profile not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Get user's company memberships with company details
    const { data: memberships, error: membershipsError } = await supabase
      .from("company_members")
      .select(
        `
        company_id,
        joined_at,
        companies (
          name,
          base_currency
        )
      `
      )
      .eq("user_id", user.id);

    if (membershipsError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch company memberships",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Transform company memberships to UserCompanyDTO format
    const companies: UserCompanyDTO[] = (memberships || [])
      .filter((m) => m.companies) // Filter out any invalid joins
      .map((m) => ({
        company_id: m.company_id,
        name: (m.companies as { name: string; base_currency: string }).name,
        base_currency: (m.companies as { name: string; base_currency: string }).base_currency,
        joined_at: m.joined_at,
      }));

    // Step 6: Build and return response
    const response: UserProfileResponseDTO = {
      user_id: profile.user_id,
      default_company_id: profile.default_company_id,
      created_at: profile.created_at,
      companies,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching profile",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;
