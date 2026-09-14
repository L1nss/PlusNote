/*
 * CONFIGURAÇÃO DO SUPABASE
 */

const SUPABASE_URL = "https://ewfstkxevtcnoyszygvm.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_isAUrfZYOq6pjtOXvWJdmw_eWU8bsS1";

if (!window.supabase) {
  throw new Error("Biblioteca do Supabase não foi carregada.");
}

window.plusnoteSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
