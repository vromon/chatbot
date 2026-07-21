// Messages are handled by FastAPI backend
// Return empty message list — no DB in Next.js
export async function GET() {
  return Response.json({
    isReadonly: false,
    messages: [],
    userId: null,
    visibility: "private",
  });
}
