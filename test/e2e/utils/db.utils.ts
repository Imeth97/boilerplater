import db from "@/db/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface TestUser {
  id: string | null;
  email: string | null;
  emailVerified: Date | null;
  password: string;
  name: string | null;
}

export async function cleanupTestUser(email: string): Promise<void> {
  try {
    await db.delete(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Error cleaning up test user:", error);
  }
}

export async function getUserByEmail(email: string): Promise<TestUser | null> {
  try {
    const result = (await db.query.user.findFirst({
      where: eq(user.email, email),
    })) as TestUser;
    return result || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

export async function createGreenmailUser(
  email: string,
  login: string,
  password: string
): Promise<boolean> {
  try {
    // First, try to delete the user if it exists
    try {
      await fetch(
        `http://localhost:8080/api/user/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );
    } catch (deleteError) {
      // Ignore delete errors - user might not exist
    }

    // Now create the user
    const response = await fetch("http://localhost:8080/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        login,
        password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Greenmail user creation failed:",
        response.status,
        errorText
      );
    }

    return response.ok;
  } catch (error) {
    console.error("Error creating Greenmail user:", error);
    return false;
  }
}
