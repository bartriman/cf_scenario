import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with SSR support for proper cookie handling
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const header = context.request.headers.get("cookie") ?? "";
        if (!header) return [];

        return header
          .split(";")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const equalsIndex = part.indexOf("=");
            if (equalsIndex === -1) {
              return { name: part, value: "" };
            }

            const name = part.slice(0, equalsIndex).trim();
            const value = part.slice(equalsIndex + 1);
            return { name, value };
          });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });

  // Make the client available to routes
  context.locals.supabase = supabase;

  // Verify user session with Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is authenticated - refresh session if needed
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      // Refresh if session expires in less than 60 seconds
      if (expiresAt && expiresAt - now < 60) {
        await supabase.auth.refreshSession();
      }
    }
  }

  // Get response from next middleware/route
  const response = await next();

  return response;
});
