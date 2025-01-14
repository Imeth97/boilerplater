import { ChangePasswordBtn } from "./Auth";
import { ProviderBtn } from "./oauth/Provider";

interface AccountResolutionProps {
  provider: string;
  email: string;
}

const AccountResolution = ({ provider, email }: AccountResolutionProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        {!!provider && (
          <div>
            {" "}
            <p>You've signed in previously with {provider}, you can </p>
            <ProviderBtn provider={provider} />{" "}
          </div>
        )}
        <br />
        {!!provider && !!email && <p>or you can set a password</p>}
        <br />
        {!!email && <ChangePasswordBtn email={email} label="Set Password" />}
      </div>
    </div>
  );
};

export default AccountResolution;
