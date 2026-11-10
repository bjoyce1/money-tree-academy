// The Lovable build has no reader accounts yet: everyone reads as a guest and
// progress is kept in this browser. (The Express build checks /api/auth/user.)
export function useAuth() {
  return { user: undefined, isLoading: false, isAuthenticated: false };
}
