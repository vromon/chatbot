// Voting is handled by FastAPI backend
export async function GET() {
  return Response.json([], { status: 200 });
}

export async function PATCH() {
  return new Response("OK", { status: 200 });
}
