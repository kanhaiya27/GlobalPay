import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export const supabase = new Proxy({}, {
  get: (target, prop) => {
    if (!supabaseInstance) {
      supabaseInstance = getSupabaseClient();
    }
    return supabaseInstance[prop];
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  if (error.code === '23505') {
    // Unique constraint violation
    if (error.message.includes('email')) {
      return { status: 400, code: 'EMAIL_CONFLICT', message: 'Email already registered' };
    }
    if (error.message.includes('phone')) {
      return { status: 400, code: 'PHONE_CONFLICT', message: 'Phone number already registered' };
    }
  }
  if (error.code === '23503') {
    // Foreign key constraint violation
    return { status: 404, code: 'NOT_FOUND', message: 'Referenced resource not found' };
  }
  return { status: 500, code: 'DATABASE_ERROR', message: 'Database error occurred' };
};
