import { useState, useEffect } from 'react';
import { AlertCircle, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface BanAppeal {
  _id: string;
  banDate: string;
  banReason: string;
  appealMessage: string;
  status: 'pending' | 'approved' | 'rejected' | 'reopen';
  createdAt: string;
  reviewedAt?: string;
  adminReview?: string;
}

export function BannedAccountPage() {
  const { toast } = useToast();
  const [appeal, setAppeal] = useState<BanAppeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealMessage, setAppealMessage] = useState('');

  useEffect(() => {
    fetchAppealStatus();
  }, []);

  const fetchAppealStatus = async () => {
    try {
      setLoading(true);
      const response = await api.getBanAppealStatus();
      setAppeal((response as any).data?.data || null);
    } catch (error) {
      console.error('Error fetching appeal status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (appealMessage.trim().length < 50) {
      toast({
        title: 'Message too short',
        description: 'Appeal message must be at least 50 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.submitBanAppeal(appealMessage.trim());

      toast({
        title: 'Appeal submitted',
        description: 'Your appeal has been submitted. An admin will review it soon.',
        variant: 'default',
      });

      setAppealMessage('');
      setShowAppealForm(false);
      setAppeal((response as any).data?.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit appeal',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenAppeal = async () => {
    if (!appeal) return;

    try {
      setSubmitting(true);
      const response = await api.reopenBanAppeal(appeal._id);

      toast({
        title: 'Appeal reopened',
        description: 'Your appeal has been reopened for review',
        variant: 'default',
      });

      setAppeal((response as any).data?.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reopen appeal',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={24} />;
      case 'approved':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={24} />;
      case 'reopen':
        return <Clock className="text-yellow-500" size={24} />;
      default:
        return <AlertCircle className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'reopen':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Suspended</h1>
          <p className="text-gray-600">Your account has been suspended. You can only appeal this decision.</p>
        </div>

        {/* Current Appeal Status */}
        {appeal && (
          <div className={`rounded-xl border-2 p-6 mb-8 ${getStatusColor(appeal.status)}`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon(appeal.status)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 capitalize">
                  Appeal Status: {appeal.status.replace('_', ' ')}
                </h3>

                {appeal.status === 'pending' && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      Your appeal is under review. We typically respond within 3-5 business days.
                    </p>
                    <p className="text-xs text-gray-600">
                      Submitted: {new Date(appeal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {appeal.status === 'approved' && (
                  <div className="space-y-2">
                    <p className="text-sm text-green-700 font-medium">✅ Your appeal has been approved!</p>
                    <p className="text-sm text-gray-700">Your account has been restored. You can now use all features.</p>
                    {appeal.adminReview && (
                      <div className="mt-3 p-3 bg-white rounded border border-green-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Admin Review:</p>
                        <p className="text-sm text-gray-700">{appeal.adminReview}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-600">
                      Reviewed: {new Date(appeal.reviewedAt || '').toLocaleDateString()}
                    </p>
                  </div>
                )}

                {appeal.status === 'rejected' && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-700 font-medium">Your appeal was rejected</p>
                    {appeal.adminReview && (
                      <div className="mt-3 p-3 bg-white rounded border border-red-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Reason:</p>
                        <p className="text-sm text-gray-700">{appeal.adminReview}</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-3">
                      You can reopen your appeal 30 days after rejection.
                    </p>
                    <Button
                      onClick={handleReopenAppeal}
                      disabled={submitting}
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      {submitting ? 'Processing...' : 'Reopen Appeal'}
                    </Button>
                  </div>
                )}

                {appeal.status === 'reopen' && (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-700 font-medium">Your appeal has been reopened</p>
                    <p className="text-sm text-gray-700">An admin will review your reopened appeal soon.</p>
                    <p className="text-xs text-gray-600">
                      Reopened: {new Date(appeal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit New Appeal */}
        {(!appeal || appeal.status === 'rejected') && !showAppealForm && (
          <Button
            onClick={() => setShowAppealForm(true)}
            className="w-full mb-8"
            disabled={appeal && appeal.status === 'pending'}
          >
            {appeal && appeal.status === 'pending' ? 'Appeal Pending Review' : 'Submit an Appeal'}
          </Button>
        )}

        {/* Appeal Form */}
        {showAppealForm && (!appeal || appeal.status === 'rejected') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit an Appeal</h3>
            <form onSubmit={handleSubmitAppeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appeal Message
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Please explain why you believe this suspension was incorrect (minimum 50 characters).
                </p>
                <textarea
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  placeholder="I believe this suspension was made in error because..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {appealMessage.length} / 2000 characters
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAppealForm(false);
                    setAppealMessage('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || appealMessage.trim().length < 50}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Submit Appeal
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Ban Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Your Suspension</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Reason for Suspension:</p>
              <p className="text-gray-600">
                Violation of platform terms of service. For specific details, please contact support.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Appeal Process:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-1">
                <li>Submit a detailed appeal explaining your situation</li>
                <li>Admin will review within 3-5 business days</li>
                <li>You'll be notified of the decision via email</li>
                <li>If rejected, you can reopen after 30 days</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Need Help?</p>
              <p className="text-gray-600">
                Contact our support team at{' '}
                <a href="mailto:support@localskillhub.com" className="text-blue-600 hover:underline">
                  support@localskillhub.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BannedAccountPage;
