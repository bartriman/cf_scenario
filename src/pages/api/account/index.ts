import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/account
 *
 * Returns user account information, companies, and scenario statistics
 */
export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!supabase || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get user's companies
    const { data: companies, error: companiesError } = await supabase
      .from("company_members")
      .select(
        `
        company_id,
        companies (
          id,
          name,
          base_currency
        )
      `
      )
      .eq("user_id", user.id);

    if (companiesError) {
      throw companiesError;
    }

    // Transform companies data
    const companiesData = (companies || []).map((cm: any) => ({
      id: cm.companies.id,
      name: cm.companies.name,
      base_currency: cm.companies.base_currency,
      role: "Member", // Default role as table doesn't have role column
    }));

    // Get scenario statistics across all user's companies
    const companyIds = companiesData.map((c) => c.id);

    const stats = {
      total: 0,
      draft: 0,
      locked: 0,
    };

    if (companyIds.length > 0) {
      const { data: scenarios, error: scenariosError } = await supabase
        .from("scenarios")
        .select("status")
        .in("company_id", companyIds)
        .is("deleted_at", null);

      if (!scenariosError && scenarios) {
        stats.total = scenarios.length;
        stats.draft = scenarios.filter((s) => s.status === "Draft").length;
        stats.locked = scenarios.filter((s) => s.status === "Locked").length;
      }
    }

    return new Response(
      JSON.stringify({
        user: {
          email: user.email,
        },
        companies: companiesData,
        stats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Account data fetch error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch account data",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
