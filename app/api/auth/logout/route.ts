import { NextResponse } from "next/server";
import { deleteSession } from "@/app/lib/auth";
import { getAppUrl } from "@/app/lib/email";

export async function POST() {
  const baseUrl = getAppUrl();

  try {
    await deleteSession();
    return NextResponse.redirect(new URL("/login", baseUrl));
  } catch (error) {
    console.error("Logout error:", error);
    // Ensure cookie is deleted even if DB operation failed
    const response = NextResponse.redirect(new URL("/login", baseUrl));
    response.cookies.delete("session_token");
    return response;
  }
}
