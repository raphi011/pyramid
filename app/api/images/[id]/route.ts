import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { postgresImageStorage } from "@/app/lib/image-storage";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const image = await postgresImageStorage.get(sql, id);
    if (!image) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(image.data, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=86400",
        "Content-Length": String(image.sizeBytes),
      },
    });
  } catch (e) {
    console.error(`GET /api/images/${id} failed:`, e);
    return new NextResponse(null, { status: 500 });
  }
}
