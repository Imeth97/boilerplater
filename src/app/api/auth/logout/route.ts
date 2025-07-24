import { signOut } from "@/lib/auth";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { redirectTo } = body;

    await signOut({
      redirect: false,
    });

    const redirectUrl = process.env.NEXT_PUBLIC_BASE_URL + (redirectTo || "/");
    return NextResponse.redirect(redirectUrl, 307);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, error: "Logout failed" } as AuthResponse,
      { status: 500 }
    );
  }
}
