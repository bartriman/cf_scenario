import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  // Extract JWT token from Authorization header
  const authHeader = context.request.headers.get('Authorization');
  
  // Create Supabase client with custom auth headers
  const supabase = createClient<Database>(
    supabaseUrl, 
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: authHeader ? {
          Authorization: authHeader
        } : {}
      }
    }
  );
  
  // Make the client available to routes
  context.locals.supabase = supabase;
  
  return next();
});
