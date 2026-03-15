import { FiFileText, FiDollarSign, FiCalendar, FiDownload } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const Contracts = () => {
  const contracts = [
    { 
      id: 1, 
      title: "Website Redesign", 
      client: "FoodieHub", 
      freelancer: "Priya Sharma",
      status: "Active", 
      budget: "₹25,000", 
      startDate: "Mar 5, 2026",
      endDate: "Mar 20, 2026",
      milestones: [
        { title: "Initial Design", amount: "₹8,000", status: "Completed", paid: true },
        { title: "Development", amount: "₹12,000", status: "In Progress", paid: false },
        { title: "Final Delivery", amount: "₹5,000", status: "Pending", paid: false },
      ]
    },
    { 
      id: 2, 
      title: "Logo Design", 
      client: "StartupXYZ", 
      freelancer: "Ananya Singh",
      status: "Completed", 
      budget: "₹8,000", 
      startDate: "Feb 28, 2026",
      endDate: "Mar 10, 2026",
      milestones: [
        { title: "Concept Design", amount: "₹4,000", status: "Completed", paid: true },
        { title: "Final Files", amount: "₹4,000", status: "Completed", paid: true },
      ]
    },
  ];

  return (
    <Layout>
      <section className="bg-white">
        <div className="w-full px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contracts</h1>
          <p className="text-gray-600 mb-8">View and manage your project agreements</p>

          <div className="space-y-6">
            {contracts.map((contract) => (
              <div key={contract.id} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{contract.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Client: {contract.client}</span>
                      <span>•</span>
                      <span>Freelancer: {contract.freelancer}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    contract.status === "Active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}>
                    {contract.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiDollarSign className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Total Budget</p>
                      <p className="font-semibold text-gray-900">{contract.budget}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCalendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Start Date</p>
                      <p className="font-semibold text-gray-900">{contract.startDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCalendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">End Date</p>
                      <p className="font-semibold text-gray-900">{contract.endDate}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Milestones</h3>
                  <div className="space-y-2">
                    {contract.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{milestone.title}</p>
                          <p className="text-sm text-gray-600">{milestone.amount}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            milestone.status === "Completed" ? "bg-green-100 text-green-700" :
                            milestone.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-200 text-gray-700"
                          }`}>
                            {milestone.status}
                          </span>
                          {milestone.paid && (
                            <span className="text-xs text-green-600 font-medium">✓ Paid</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <Button variant="outline" className="border-gray-300 rounded-full gap-2">
                    <FiDownload className="h-4 w-4" /> Download Contract
                  </Button>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contracts;
