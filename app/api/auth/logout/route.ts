import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await deleteSession();
    return NextResponse.redirect(new URL("/login", request.url));
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Also support GET for simple logout links
export async function GET(request: NextRequest) {
  return POST(request);
}
