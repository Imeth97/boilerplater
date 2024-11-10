"use server";
import { auth } from ".";

export async function isUserAuthenticated() {
  const session = await auth();

  return !!session?.user;
}
