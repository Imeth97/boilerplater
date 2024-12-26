import { auth } from "@/components/auth";
import { ChangePasswordBtn } from "@/components/auth/Auth";
import db from "@/db/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const BoldSpan = ({ name }: { name: string }) => {
  return (
    <span data-testid="user-name" className="font-semibold text-blue-600">
      {name}
    </span>
  );
};

const Dashboard = async () => {
  const session = await auth();

  // @todo: this is a hack to get the emailVerified status, need to find a better way e.g. using the session object
  const isEmailVerified = await db
    .select()
    .from(user)
    .where(eq(user.id, session?.user?.id!))
    .then((rows) => rows[0]?.emailVerified ?? false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          This is a dummy dashboard page.
        </h1>
        <p className="mt-2 text-gray-600">
          The currently signed-in user is{" "}
          <BoldSpan name={session?.user?.name || "Unknown User"} />.
          <br />
          Their email is{" "}
          <BoldSpan name={isEmailVerified ? "verified" : "not verified"} />.
          <br />
          {isEmailVerified ? (
            <ChangePasswordBtn email={session?.user?.email || ""} />
          ) : (
            "Please check the user's email for a verification link."
          )}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
