import { ChangePasswordBtn } from "@/components/auth/Auth";
import { getUserDetails } from "@/lib/auth/utils";
import { redirect } from "next/navigation";

const BoldSpan = ({ name }: { name: string }) => {
  return (
    <span data-testid="user-name" className="font-semibold text-blue-600">
      {name}
    </span>
  );
};

const Dashboard = async () => {
  const userDetails = await getUserDetails();

  if (!userDetails) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          This is a dummy dashboard page.
        </h1>
        <div className="mt-2 text-gray-600">
          The currently signed-in user is{" "}
          <BoldSpan name={userDetails.name || "Unknown User"} />.
          <br />
          {!!userDetails?.provider ? (
            <div>
              <p>User is signed in with {userDetails.provider}</p>
            </div>
          ) : (
            <div>
              Their email is{" "}
              <BoldSpan
                name={userDetails?.emailVerified ? "verified" : "not verified"}
              />
              .
              <br />
              {userDetails?.emailVerified ? (
                <ChangePasswordBtn
                  email={userDetails.email || ""}
                  label="Set Password"
                />
              ) : (
                "Please check the user's email for a verification link."
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
