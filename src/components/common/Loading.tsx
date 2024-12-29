import { Loader2 } from "lucide-react";

const Loading = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    </div>
  </div>
);

export default Loading;
