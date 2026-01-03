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

  // Get and refresh session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Session exists - check if it needs refresh
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    // Refresh if session expires in less than 60 seconds
    if (expiresAt && expiresAt - now < 60) {
      await supabase.auth.refreshSession();
    }
  }

  // Get response from next middleware/route
  const response = await next();

  return response;
});
