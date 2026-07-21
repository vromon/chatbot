// Suggestions are handled by FastAPI backend
export async function GET() {
  return Response.json([], { status: 200 });
}
