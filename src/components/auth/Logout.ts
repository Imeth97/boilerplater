"use server";
import { signOut as naSignOut } from ".";

export async function Logout() {
  await naSignOut({
    redirectTo: "/",
  });
}
