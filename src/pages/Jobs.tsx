import { useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiMapPin, FiClock, FiDollarSign } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const mockJobs = [
  { id: 1, title: "Website Redesign for Restaurant", client: "FoodieHub", city: "Mumbai", budget: "₹15,000 - ₹25,000", type: "Fixed", skills: ["React", "Figma", "CSS"], posted: "2 hours ago", proposals: 5, remote: false },
  { id: 2, title: "Social Media Marketing Campaign", client: "GreenLeaf Co.", city: "Bangalore", budget: "₹8,000 - ₹12,000", type: "Fixed", skills: ["Instagram", "Facebook Ads"], posted: "5 hours ago", proposals: 12, remote: true },
  { id: 3, title: "Mobile App UI/UX Design", client: "TechStart", city: "Delhi", budget: "₹2,000 - ₹3,000/hr", type: "Hourly", skills: ["Figma", "Mobile Design"], posted: "1 day ago", proposals: 8, remote: true },
];

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Find Local Jobs</h1>
          <p className="text-lg text-gray-600 mb-8">Browse opportunities in your region</p>
          
          <div className="bg-white border border-gray-300 rounded-2xl p-2 max-w-2xl shadow-sm">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                <FiSearch className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="bg-transparent w-full outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-8">Search</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="space-y-4">
            {mockJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-gray-600">{job.client}</p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">{job.type}</span>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <FiMapPin className="h-4 w-4" />
                    <span>{job.city}</span>
                    {job.remote && <span className="text-green-600">(Remote OK)</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiDollarSign className="h-4 w-4" />
                    <span className="font-semibold text-gray-900">{job.budget}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiClock className="h-4 w-4" />
                    <span>{job.posted}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{skill}</span>
                  ))}
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">{job.proposals}</span> proposals submitted
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" className="border-2 border-gray-300 px-8 py-6 rounded-full">Load More Jobs</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Jobs;
