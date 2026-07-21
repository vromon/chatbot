// Guest auth is handled by FastAPI backend — redirect straight to home
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") ?? "/";
  return Response.redirect(new URL(redirectUrl, request.url));
}
