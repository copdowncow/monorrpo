import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function createAdmin() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'TajPaintball2024!';
  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from('admins')
    .upsert({ login, password_hash: hash, role: 'superadmin', full_name: 'Администратор' }, { onConflict: 'login' })
    .select().single();
  if (error) { console.error('Error:', error); process.exit(1); }
  console.log(`Admin created: ${data.login}`);
  process.exit(0);
}
createAdmin();
