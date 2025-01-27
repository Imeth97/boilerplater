import Link from "next/link";

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">Boilerplater</h1>
        <div className="text-gray-600">
          Look&apos;s like you&apos;ve got the boilerplate running. Nothing more
          should be needed, however to get the github OAuth to work, you&apos;ll
          need to add the AUTH_GITHUB_ID and AUTH_GITHUB_SECRET to the .env
          file. See more details{" "}
          <Link
            href={
              "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app"
            }
            className="text-blue-500 hover:underline"
          >
            here.
          </Link>
          <br />
          See the src/components/auth/oauth/config.ts file to explore ways to
          add more providers.
          <br />
          Visit the{" "}
          <Link
            href={
              "https://github.com/Imeth97/boilerplater/tree/release/vercel-neon?tab=readme-ov-file#this-branch-contains-the-changes-to-deploy-to-vercel-with-neon-as-the-database"
            }
            className="text-blue-500 hover:underline"
          >
            release/vercel-neon
          </Link>{" "}
          branch to see how we deployed this app using Vercel and NeonDB.
        </div>
      </div>
    </div>
  );
}
