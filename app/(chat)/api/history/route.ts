// Chat history is handled by FastAPI backend
// Return empty history — no DB in Next.js
export async function GET() {
  return Response.json({ chats: [], hasMore: false });
}

export async function DELETE() {
  return Response.json({ deletedCount: 0 }, { status: 200 });
}
