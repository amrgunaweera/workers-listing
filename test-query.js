import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPendingWorkers() {
  console.log("Checking workers...");
  const { data: workers, error } = await supabase.from('workers').select('*').order('createdAt', { ascending: false }).limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Latest 5 workers:");
    workers.forEach(w => console.log(`- ${w.name} | Status: ${w.status} | Available: ${w.available} | CreatedAt: ${w.createdAt}`));
  }
}

checkPendingWorkers();
