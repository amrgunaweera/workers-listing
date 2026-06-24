import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSignUp() {
  const email = `testworker${Date.now()}@bestservicelk.com`;
  console.log("Attempting sign up with:", email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
  });
  
  if (error) {
    console.error("Sign up error:", error.message);
  } else {
    console.log("Sign up success!");
    console.log("Session exists?", !!data.session);
    console.log("User email confirmed?", data.user?.email_confirmed_at != null);
  }
}

checkSignUp();
