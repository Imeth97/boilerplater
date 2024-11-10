import { auth } from "@/components/auth";

const Dashboard = async () => {
  const session = await auth();

  return <div>{session?.user?.name}</div>;
}

export default Dashboard;