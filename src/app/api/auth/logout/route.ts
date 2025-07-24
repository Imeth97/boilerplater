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

    const redirectUrl = redirectTo || "/";
    return NextResponse.json(
      { success: true, redirect: redirectUrl } as AuthResponse,
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, error: "Logout failed" } as AuthResponse,
      { status: 500 }
    );
  }
}
