import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { processImage, ImageValidationError } from "@/app/lib/image-processing";
import { postgresImageStorage } from "@/app/lib/image-storage";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(buffer, file.type);
    const id = await postgresImageStorage.store(sql, processed);

    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof ImageValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("Image upload failed:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
