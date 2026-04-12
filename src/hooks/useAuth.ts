// Stub auth hook - will be replaced with Supabase auth
export function useAuth() {
  return {
    user: null as any,
    isLoading: false,
    isAuthenticated: false,
  };
}
