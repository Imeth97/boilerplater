import { auth } from "@/components/auth";

const User = ({ name }: { name: string }) => {
  return (
    <span data-testid="user-name" className="font-semibold text-blue-600">
      {name}
    </span>
  );
};

const Dashboard = async () => {
  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          This is a dummy dashboard page.
        </h1>
        <p className="mt-2 text-gray-600">
          The currently signed-in user is{" "}
          <User name={session?.user?.name || "Unknown User"} />.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
