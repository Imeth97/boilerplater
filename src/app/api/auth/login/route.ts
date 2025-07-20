import db from "@/db/db";
import { account, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from "@/lib/auth";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (["", null, undefined].includes(email)) {
      return NextResponse.json(
        { success: false, error: "Email is required" } as AuthResponse,
        { status: 400 }
      );
    }

    if (["", null, undefined].includes(password)) {
      return NextResponse.json(
        { success: false, error: "Password is required" } as AuthResponse,
        { status: 400 }
      );
    }

    // check if the user had previously used this email via oauth
    const { provider, password: userPassword } = await db
      .select({
        provider: account.provider,
        password: user.password,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email ?? ""))
      .then((result) => result[0]);

    // if there is a provider and no password, user previously signed in with oauth
    if (!!provider && !userPassword) {
      return NextResponse.json(
        {
          success: false,
          redirect: `/login?provider=${provider}&email=${email}`,
        } as AuthResponse,
        { status: 409 }
      );
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: email ?? "",
      password: password ?? "",
    });

    // Check if authentication was successful
    if (result?.error) {
      return NextResponse.json(
        { success: false, error: "Authentication failed" } as AuthResponse,
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true } as AuthResponse,
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" } as AuthResponse,
      { status: 401 }
    );
  }
}