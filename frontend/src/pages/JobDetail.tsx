import { useParams, Link } from "react-router-dom";
import { FiMapPin, FiDollarSign, FiClock, FiUsers, FiCalendar } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const JobDetail = () => {
  const { id } = useParams();

  const job = {
    title: "Website Redesign for Restaurant",
    client: "FoodieHub",
    location: "Mumbai",
    budget: "₹15,000 - ₹25,000",
    type: "Fixed Price",
    posted: "2 hours ago",
    proposals: 5,
    description: "We're looking for an experienced web designer to completely redesign our restaurant website. The new design should be modern, mobile-friendly, and optimized for conversions.",
    requirements: [
      "5+ years of web design experience",
      "Proficiency in Figma and modern CSS",
      "Portfolio with restaurant/food industry work",
      "Ability to deliver within 2 weeks"
    ],
    skills: ["React", "Figma", "CSS", "Responsive Design"],
    remote: false,
  };

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="mb-6">
            <Link to="/jobs" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back to Jobs
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
              <p className="text-lg text-gray-600">Posted by {job.client}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <FiMapPin className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">{job.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiDollarSign className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Budget</p>
                  <p className="font-semibold text-gray-900">{job.budget}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Posted</p>
                  <p className="font-semibold text-gray-900">{job.posted}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiUsers className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Proposals</p>
                  <p className="font-semibold text-gray-900">{job.proposals}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Job Description</h2>
              <p className="text-gray-700 leading-relaxed">{job.description}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">✓</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-full py-6 text-base font-semibold">
                Submit Proposal
              </Button>
              <Button variant="outline" className="border-2 border-gray-300 rounded-full px-8">
                Save Job
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default JobDetail;
