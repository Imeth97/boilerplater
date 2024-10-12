import MaxWidthWrapper from "@/components/ common/MaxWidthWrapper";
import { Loader } from "lucide-react";

// Loading component for the dashboard
const Loading = () => (
  <main>
    <MaxWidthWrapper className='mb-12 mt-28 sm:mt-40 flex flex-col items-center justify-center'>
      <div className='flex justify-center mt-6'>
        <Loader
          name='Loading Presentation...'
          className='animate-spin text-slate-500'
        />
      </div>
    </MaxWidthWrapper>
  </main>
);

export default Loading;
