import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { postgresImageStorage } from "@/app/lib/image-storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Basic UUID format validation
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return new NextResponse(null, { status: 404 });
  }

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
}
