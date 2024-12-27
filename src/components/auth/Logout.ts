"use server";
import { signOut as naSignOut } from ".";

export async function Logout(redirectTo?: string) {
  await naSignOut({
    redirect: !!redirectTo,
    redirectTo: redirectTo,
  });
}
