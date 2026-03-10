import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const NotFound = () => {
  return (
    <Layout>
      <section className="bg-white py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-8 py-6">
                Go Home
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" className="border-2 border-gray-300 rounded-full px-8 py-6">
                Browse Freelancers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
