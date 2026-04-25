import Layout from "@/components/layout/Layout";
import MessagesTab from "@/components/dashboard/MessagesTab";
import { useSearchParams } from "react-router-dom";

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("targetUserId") || undefined;

  return (
    <Layout>
      <div className="w-full bg-[#f4f2ed]">
        <div className="w-full border sm:h-[600px]  mx-auto py-10 px-4">
          <MessagesTab  initialTargetUserId={targetUserId}  />
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
