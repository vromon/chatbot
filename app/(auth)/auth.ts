// Auth is handled by FastAPI backend.
// This stub always returns a dummy session so the UI renders without login.

export type UserType = "guest" | "regular";

const DUMMY_USER = {
  id: "local-user",
  email: "user@local",
  name: "User",
  type: "regular" as UserType,
};

export async function auth() {
  return {
    user: DUMMY_USER,
  };
}

export async function signIn(_provider: string, _credentials: unknown) {}
export async function signOut() {}

// Kept for NextAuth route handler compatibility
export const handlers = {
  GET: () => new Response(null, { status: 200 }),
  POST: () => new Response(null, { status: 200 }),
};
