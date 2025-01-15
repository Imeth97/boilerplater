"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { providerIcons, providersConfig } from "./config";

interface Provider {
  name: string;
  Icon: React.ElementType;
  loginAction: () => Promise<void>;
}

const Provider = ({ name, Icon, loginAction }: Provider) => {
  const [isPending, setIsPending] = useState<boolean>(false);
  const onClick = async () => {
    setIsPending(true);
    await loginAction();
  };
  return (
    <div className="flex items-center justify-center mt-3 space-x-2">
      <Button
        className="flex items-center justify-center mt-3 space-x-2"
        onClick={onClick}
        variant="outline"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        ) : (
          <Icon className="h-5 w-5 text-gray-600" />
        )}
        <span className="text-gray-800 font-medium">Login with {name}</span>
      </Button>
    </div>
  );
};

export const ProviderBtn = ({ provider }: { provider: string }) => {
  const { icon, name, action } = providerIcons[provider] ?? {};
  if (!icon || !name || !action) return null;
  return <Provider Icon={icon} name={name} loginAction={action} />;
};

export default (providersConfig as Provider[]).map((provider, index) => {
  return <Provider {...provider} key={index} />;
}) as JSX.Element[];
