import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { providersConfig } from "./config";

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

export default (providersConfig as Provider[]).map((provider) => {
  return <Provider {...provider} />;
}) as JSX.Element[];
