import Layout from "@/components/layout/Layout";
import MessagesTab from "@/components/dashboard/MessagesTab";
import { useSearchParams } from "react-router-dom";

const Messages = () => {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId") || undefined;

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <MessagesTab initialTargetUserId={targetUserId} />
        </div>
      </section>
    </Layout>
  );
};

export default Messages;
