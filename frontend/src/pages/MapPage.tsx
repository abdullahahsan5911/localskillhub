import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import MapView from '../components/MapView';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Region-Specific Discovery</h1>
          <p className="text-gray-600">
            Geo-filter by city/state, discover local jobs and freelancers, and sort by distance, rates, and rating.
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Freelancer Profile Discovery</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Skill tags, rates, and local availability are visible directly in map cards.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Portfolio signals, past jobs + reviews, endorsements, and social proof are highlighted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Local reputation shown as: Overall Score | Local Trust | Skill Trust.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Use map + feed together to quickly shortlist nearby verified freelancers.</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Local Job Listing & Hiring Workflow</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Clients can post local jobs, define location/remote zone, and set budget/rate.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Milestones, invited freelancers, and proposal activity are visible in local job feed cards.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Freelancers can assess workflow readiness for proposals, packages, and invite acceptance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Region-first matching improves trust signals and hiring speed.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MapPage;
