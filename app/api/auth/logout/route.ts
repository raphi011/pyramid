import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await deleteSession();
    return NextResponse.redirect(new URL("/login", request.url));
  } catch (error) {
    console.error("Logout error:", error);
    // Ensure cookie is deleted even if DB operation failed
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session_token");
    return response;
  }
}
