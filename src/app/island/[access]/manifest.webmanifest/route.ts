import { NextResponse } from "next/server";
import manifest from "@/app/manifest";
import { accessRole } from "@/lib/link-access";
export const dynamic = "force-dynamic";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ access: string }> },
) {
  const { access } = await params;
  if (!accessRole(access)) return new NextResponse("無效連結", { status: 403 });
  return NextResponse.json(
    {
      ...manifest(),
      id: "/island/" + access,
      start_url: "/island/" + access,
      scope: "/",
      name:
        accessRole(access) === "student" ? "臭凝的讀書島" : "讀書島・家長只讀",
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
