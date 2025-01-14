import { GithubLogin } from "@/lib/auth/GithubLogin";
import { Github } from "lucide-react";

export const providersConfig = [
  {
    name: "GitHub",
    Icon: Github,
    loginAction: GithubLogin,
  },
];
