/**
 * Supabase Client Initialization
 */
const SUPABASE_URL = "https://agskeoyfeayozmlmmzuq.supabase.co";
const SUPABASE_KEY = "sb_publishable_cc1P7dWs3Ne7DYXAItxN9A_XhJ10tI8";

// Initialization with a unique name to avoid conflict with the library 'supabase'
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = client;
console.log('SCI Cloud Client initialized.');
