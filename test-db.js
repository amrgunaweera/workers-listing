import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Using simple fetch to avoid websocket issues with realtime
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkPendingWorkers() {
  console.log("Fetching all workers...");
  const { data: workers, error } = await supabase.from('workers').select('*').order('createdAt', { ascending: false }).limit(10);
  if (error) {
    console.error("Error fetching workers:", error);
  } else {
    console.log("Latest 10 workers in DB:");
    workers.forEach(w => {
      console.log(`- ID: ${w.id} | Name: ${w.name} | Status: ${w.status} | Available: ${w.available}`);
    });
  }
  
  console.log("\nFetching all users (table)...");
  const { data: users, error: uError } = await supabase.from('users').select('*').order('createdAt', { ascending: false }).limit(10);
  if (uError) {
    console.error("Error fetching users:", uError);
  } else {
    console.log("Latest 10 users in DB:");
    users.forEach(u => {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Role: ${u.role}`);
    });
  }
}

checkPendingWorkers();
