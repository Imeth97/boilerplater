import { GithubLogin } from "@/lib/auth/GithubLogin";
import { Github } from "lucide-react";

export const providersConfig = [
  {
    name: "GitHub",
    Icon: Github,
    loginAction: GithubLogin,
  },
];

interface ProviderIcons {
  [key: string]: {
    name: string;
    action: () => Promise<void>;
    icon: React.ElementType;
  };
}

export const providerIcons: ProviderIcons = {
  github: {
    name: "GitHub",
    action: GithubLogin,
    icon: Github,
  },
};
