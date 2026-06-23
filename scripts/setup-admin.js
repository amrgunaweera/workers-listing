import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const SUPABASE_URL = 'https://srpmoocwemzmzvjyaudf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yO5M6ix-0KvBhG5dfdvNxg_66gmvo4z';

// Load .env variables manually in Node.js
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const ADMIN_EMAIL = 'admin@bestservices.lk';
const ADMIN_PASSWORD = 'Admin@123456'; // Change this to your desired password

async function apiCall(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: response.status, ok: response.ok, data: json };
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function run() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('🔑 SUPABASE_SERVICE_ROLE_KEY not found in environment or .env file.');
    SUPABASE_SERVICE_ROLE_KEY = await askQuestion('👉 Please paste your Supabase service_role (secret) key: ');
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ service_role key is required to clear database and setup admin!');
      process.exit(1);
    }
  }

  const serviceHeaders = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  console.log('🗑️  Step 1: Clearing public.workers table...');
  const delWorkers = await apiCall(`${SUPABASE_URL}/rest/v1/workers?id=not.is.null`, {
    method: 'DELETE',
    headers: serviceHeaders,
  });
  if (!delWorkers.ok && delWorkers.status !== 404) {
    console.error('Failed to delete workers:', delWorkers.data);
  } else {
    console.log('✅ Workers cleared.');
  }

  console.log('🗑️  Step 2: Clearing public.users table...');
  const delUsers = await apiCall(`${SUPABASE_URL}/rest/v1/users?id=not.is.null`, {
    method: 'DELETE',
    headers: serviceHeaders,
  });
  if (!delUsers.ok && delUsers.status !== 404) {
    console.error('Failed to delete users:', delUsers.data);
  } else {
    console.log('✅ Users cleared.');
  }

  console.log('🗑️  Step 3: Listing and deleting all auth users...');
  const listAuth = await apiCall(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    method: 'GET',
    headers: serviceHeaders,
  });
  if (!listAuth.ok) {
    console.error('Failed to list auth users:', listAuth.data);
  } else {
    const authUsers = listAuth.data.users || [];
    console.log(`   Found ${authUsers.length} auth user(s) to delete.`);
    for (const u of authUsers) {
      const del = await apiCall(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: serviceHeaders,
      });
      if (del.ok) {
        console.log(`   ✅ Deleted auth user: ${u.email}`);
      } else {
        console.error(`   ❌ Failed to delete ${u.email}:`, del.data);
      }
    }
  }

  console.log(`\n👤 Step 4: Creating admin user: ${ADMIN_EMAIL}...`);
  const createAdmin = await apiCall(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    }),
  });
  if (!createAdmin.ok) {
    console.error('❌ Failed to create admin auth user:', createAdmin.data);
    process.exit(1);
  }
  const adminUser = createAdmin.data;
  console.log(`✅ Admin auth user created. ID: ${adminUser.id}`);

  console.log('📝 Step 5: Inserting admin into public.users table...');
  const insertUser = await apiCall(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      id: adminUser.id,
      email: ADMIN_EMAIL,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }),
  });
  if (!insertUser.ok) {
    console.error('❌ Failed to insert admin into public.users:', insertUser.data);
    process.exit(1);
  }
  console.log('✅ Admin record inserted into public.users.');

  console.log('\n🎉 Done! Admin account setup complete.');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

run().catch(console.error);
