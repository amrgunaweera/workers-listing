import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
// Since we don't have the env vars loaded, I will read them from .env

import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Starting signup...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'testworker999@bestservicelk.com',
    password: 'password123',
  });

  if (authError) {
    console.error("Auth error:", authError);
    return;
  }

  console.log("Signup success:", authData.user?.id);

  console.log("Inserting user...");
  const { error: userError } = await supabase.from('users').insert([{
    id: authData.user.id,
    email: 'testworker999@bestservicelk.com',
    phone: '0712345678',
    role: 'worker',
    createdAt: new Date().toISOString(),
  }]);

  if (userError) {
    console.error("User insert error:", userError);
  } else {
    console.log("User insert success");
  }
}

test();
