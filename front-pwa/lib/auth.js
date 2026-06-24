import { supabase } from './supabase';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

// El rol se guarda en user_metadata al crear el usuario.
// Para marcar un usuario como admin, ejecutar en Supabase SQL Editor:
//   UPDATE auth.users
//   SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'), '{role}', '"admin"')
//   WHERE email = 'tu@email.com';
export function isAdmin(user) {
  return user?.user_metadata?.role === 'admin';
}
