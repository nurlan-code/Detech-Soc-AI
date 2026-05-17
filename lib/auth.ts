import { supabase } from "./supabase";

export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/login";
}
