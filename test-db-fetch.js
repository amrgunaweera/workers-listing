import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function fetchWorkers() {
  const url = `${supabaseUrl}/rest/v1/workers?select=*&order=createdAt.desc&limit=10`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  if (!res.ok) {
    console.error("Error fetching workers:", await res.text());
    return;
  }
  
  const data = await res.json();
  console.log("Latest 10 workers in DB:");
  data.forEach(w => {
    console.log(`- ID: ${w.id} | Name: ${w.name} | Status: ${w.status} | Available: ${w.available} | CreatedAt: ${w.createdAt}`);
  });
}

fetchWorkers();
