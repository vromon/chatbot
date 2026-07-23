// Auth is handled by FastAPI backend.
// This stub always returns a dummy session so the UI renders without login.

export type UserType = "guest" | "regular";

const DUMMY_USER = {
  email: "user@local",
  id: "local-user",
  name: "User",
  type: "regular" as UserType,
};

export function auth() {
  return {
    user: DUMMY_USER,
  };
}

export function signIn(_provider: string, _credentials: unknown) {
  console.log("signIn called with provider:");
}
// export async function signOut() {}

// Kept for NextAuth route handler compatibility
export const handlers = {
  GET: () => new Response(null, { status: 200 }),
  POST: () => new Response(null, { status: 200 }),
};
