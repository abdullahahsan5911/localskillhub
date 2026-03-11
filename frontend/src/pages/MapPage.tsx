import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import MapView from '@/components/MapView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiUser, FiBriefcase } from 'react-icons/fi';

const MapPage = () => {
  const [viewType, setViewType] = useState<'freelancers' | 'jobs'>('freelancers');

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Nearby</h1>
          <p className="text-gray-600">
            Discover local talent and opportunities on the interactive map
          </p>
        </div>

        {/* View Type Toggle */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex gap-2">
              <Button
                variant={viewType === 'freelancers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('freelancers')}
                className="flex items-center gap-2"
              >
                <FiUser className="h-4 w-4" />
                Freelancers
              </Button>
              <Button
                variant={viewType === 'jobs' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('jobs')}
                className="flex items-center gap-2"
              >
                <FiBriefcase className="h-4 w-4" />
                Jobs
              </Button>
            </div>
          </div>
        </Card>

        {/* Map View */}
        <MapView type={viewType} height="700px" />

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Grant location access to see nearby opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Use filters to refine results by skills, budget, rating, etc.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Click markers to view details and profiles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Adjust radius to expand or narrow your search area</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Location Matters</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Build local trust and reputation in your community</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Faster communication and in-person meetings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Support your local economy and network</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Access region-specific opportunities and events</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MapPage;
