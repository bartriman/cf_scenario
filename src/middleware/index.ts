import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookie-based session
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        // Get cookies from Astro context
        cookie: context.request.headers.get("cookie") || "",
      },
    },
  });

  // Make the client available to routes
  context.locals.supabase = supabase;

  // Get response from next middleware/route
  const response = await next();

  // Note: In production, you might want to use @supabase/ssr for better cookie handling
  // This is a simplified version that works with Supabase Auth cookies

  return response;
});
