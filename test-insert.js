import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Pure fetch

async function testInsert() {
  const dummyId = "f5d02a0f-1234-4a37-b956-03247cdf2220"; // some random uuid or we can use admin token
  
  // Actually let's just make a REST call to insert to see if it complains about schema
  const url = `${supabaseUrl}/rest/v1/workers?select=*&limit=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    }
  });
  
  if (!res.ok) {
    console.error("Fetch failed:", await res.text());
  } else {
    const data = await res.json();
    console.log("Worker schema keys:", Object.keys(data[0]));
  }
}

testInsert();
