import { headers } from "next/headers";

export const checkAuth = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/auth/check-auth", {
      method: "GET",
      headers: headers(),
    });
    const data = await response.json();
    return !!data.authenticated;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};
