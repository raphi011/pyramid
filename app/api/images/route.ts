import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { processImage, ImageValidationError } from "@/app/lib/image-processing";
import { postgresImageStorage } from "@/app/lib/image-storage";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Reject oversized files before reading into memory
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum: 10MB`,
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(buffer);
    const id = await postgresImageStorage.store(sql, processed, player.id);

    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof ImageValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("Image upload failed:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
