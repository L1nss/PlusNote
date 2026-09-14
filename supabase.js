/*
 * CONFIGURAÇÃO DO SUPABASE
 *
 * Substitua os dois valores abaixo pelos dados de:
 * Supabase > Project Settings > API
 *
 * A chave anon/publishable pode ficar no frontend. NUNCA coloque a service_role aqui.
 */
const SUPABASE_URL = "https://ewfstkxevtcnoyszygvm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_isAUrfZYOq6pjtOXvWJdmw_eWU8bsS1";

if (!window.supabase) {
  throw new Error("Biblioteca do Supabase não carregada.");
}

if (SUPABASE_URL.includes("YOUR_PROJECT") || SUPABASE_ANON_KEY.includes("YOUR_ANON_OR_PUBLISHABLE_KEY")) {
  console.warn("PlusNote: configure SUPABASE_URL e SUPABASE_ANON_KEY em supabase.js.");
}

window.plusnoteSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
