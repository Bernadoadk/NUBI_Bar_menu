const CONFIG = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Export for use in other scripts
export default CONFIG;
window.CONFIG = CONFIG; // Ensure visibility for scripts that don't use imports yet
