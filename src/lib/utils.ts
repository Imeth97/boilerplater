import { clsx, type ClassValue } from "clsx";
import jwt from "jsonwebtoken";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const verifyToken = (token: string, secret: string) => {
  try {
    jwt.verify(token, secret);
    return true;
  } catch (error) {
    return false;
  }
};
