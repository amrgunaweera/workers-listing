import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const deleteAvatarFile = async (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.includes('/avatars/')) return;
  try {
    const parts = avatarUrl.split('/avatars/');
    let filePath = parts[parts.length - 1].split('?')[0]; // Remove query params if any
    filePath = decodeURIComponent(filePath); // Decode URL-encoded characters
    if (filePath.startsWith('/')) filePath = filePath.substring(1); // Ensure no leading slash
    if (filePath) {
      const { data, error } = await supabase.storage.from('avatars').remove([filePath]);
      if (error) {
        console.error('Supabase Storage Error:', error.message);
      } else if (!data || data.length === 0) {
        console.warn('Supabase Storage Warning: File was not deleted (possibly due to RLS policies or file not found). File:', filePath);
      }
    }
  } catch (err) {
    console.error('Failed to parse/delete avatar from storage:', err);
  }
};
