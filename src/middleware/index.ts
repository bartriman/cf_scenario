import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/update-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/update-password",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request } = context;

  // Create Supabase client with cookie support
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make the client available to routes
  locals.supabase = supabase;

  // Get user session and refresh if needed
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If there's an auth error, clear any stale session data
  if (authError) {
    await supabase.auth.signOut();
  }

  if (user) {
    locals.user = {
      id: user.id,
      email: user.email,
    };
  }

  // Check if the path requires authentication
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path));

  // Redirect to login if trying to access protected route without authentication
  if (!isPublicPath && !user) {
    // Save the intended destination for redirect after login
    const redirectTo = url.pathname + url.search;
    const loginUrl = new URL("/auth/login", url.origin);

    // Only add redirect parameter if it's not the login page itself
    if (redirectTo !== "/" && redirectTo !== "/auth/login") {
      loginUrl.searchParams.set("redirectTo", redirectTo);
    }

    return context.redirect(loginUrl.toString());
  }

  return next();
});
