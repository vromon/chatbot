// File uploads are handled by FastAPI backend
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "File upload is handled by the FastAPI backend" },
    { status: 501 }
  );
}
