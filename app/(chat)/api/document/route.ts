// Documents are handled by FastAPI backend
export async function GET() {
  return Response.json([], { status: 200 });
}

export async function POST() {
  return Response.json({}, { status: 200 });
}

export async function DELETE() {
  return Response.json([], { status: 200 });
}
