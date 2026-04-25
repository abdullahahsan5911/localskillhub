import { useQuery } from '@tanstack/react-query';
import { fetchReputations, adjustReputationScore } from '@/lib/adminApi';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState } from 'react';
import { Search, Star, TrendingUp, Edit, RotateCw, Radio, MapPin, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { resolveAvatarSrc } from '@/lib/avatar';

export default function ReputationScores() {
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [adjustField, setAdjustField] = useState('overallScore');
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const { toast } = useToast();
  
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-reputations', search],
    queryFn: () => {
      setLastUpdated(new Date().toLocaleTimeString());
      return fetchReputations({ search });
    },
    // Real-time polling settings
    refetchInterval: isRealTime ? 5000 : false, // Poll every 5 seconds when real-time is enabled
    refetchIntervalInBackground: true, // Keep polling even when tab is not focused
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  const scores = (data as any)?.data || [];

  const handleAdjust = async () => {
    if (!selectedRep || !adjustValue || !adjustReason.trim()) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setIsAdjusting(true);
    try {
      await adjustReputationScore(selectedRep.userId?._id, adjustField, parseFloat(adjustValue), adjustReason);
      toast({ title: 'Success', description: 'Reputation score adjusted' });
      refetch();
      setSelectedRep(null);
      setAdjustField('overallScore');
      setAdjustValue('');
      setAdjustReason('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Reputation Management</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: <span className="font-mono text-gray-700">{lastUpdated}</span>
              {isFetching && <span className="ml-2 text-blue-500">• Updating...</span>}
            </div>
          )}
          <Button
            variant={isRealTime ? "default" : "outline"}
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className={isRealTime ? "bg-green-500 hover:bg-green-600" : ""}
          >
            <Radio className="h-4 w-4 mr-2" />
            {isRealTime ? "Live" : "Manual"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium text-gray-600">
              User Reputation Scores & Metrics
              {scores.length > 0 && (
                <span className="ml-3 text-xs text-gray-500 font-normal">
                  {scores.length} user{scores.length !== 1 ? 's' : ''} loaded
                </span>
              )}
            </CardTitle>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50 border-gray-200 pl-10 text-gray-900 placeholder-gray-500 focus:border-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-gray-200 bg-gray-50">
              <TableRow>
                <TableHead className="text-gray-600">User</TableHead>
                <TableHead className="text-gray-600">Review Score</TableHead>
                <TableHead className="text-gray-600">Completion</TableHead>
                <TableHead className="text-gray-600">Reliability</TableHead>
                <TableHead className="text-gray-600">Level</TableHead>
                <TableHead className="text-gray-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    Loading scores...
                  </TableCell>
                </TableRow>
              ) : scores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                scores.map((rep: any) => (
                  <TableRow key={rep._id} className="border-gray-200 hover:bg-gray-50 transition-colors">
                    <TableCell className="text-slate-300">
                      <div className="font-medium text-black">{rep.userId?.name}</div>
                      <div className="text-[10px] text-slate-700 font-mono tracking-tighter capitalize">{rep.userId?.role}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold text-lg">{rep.scores?.reviews?.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-black font-medium">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        {rep.scores?.performance?.completionRate || 0}%
                      </div>
                    </TableCell>
                    <TableCell className="text-black">
                      <span className="font-semibold">{rep.skillTrustScore || 0}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500 px-2 py-0">
                        {rep.overallScore >= 80 ? 'Elite' : rep.overallScore >= 60 ? 'Pro' : 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-slate-400 hover:text-emerald-400"
                        onClick={() => setSelectedRep(rep)}
                      >
                        <Edit size={14} className="mr-1.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reputation Details Modal */}
      <Dialog open={!!selectedRep} onOpenChange={(open) => !open && setSelectedRep(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Reputation Details</DialogTitle>
            <DialogDescription>View and adjust reputation scores</DialogDescription>
          </DialogHeader>

          {selectedRep && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="border-b pb-4">
                <div className="flex items-start gap-4">
                  <img src={resolveAvatarSrc(selectedRep.userId?.avatar)} alt={selectedRep.userId.name} className="w-16 h-16 rounded-lg" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{selectedRep.userId?.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedRep.userId?.role}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {selectedRep.userId?.location?.city}, {selectedRep.userId?.location?.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Overall Score</p>
                  <p className="text-3xl font-bold text-blue-900">{selectedRep.overallScore || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-semibold mb-1">Local Trust</p>
                  <p className="text-3xl font-bold text-purple-900">{selectedRep.localTrustScore || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
                  <p className="text-xs text-emerald-600 font-semibold mb-1">Skill Trust</p>
                  <p className="text-3xl font-bold text-emerald-900">{selectedRep.skillTrustScore || 0}</p>
                </div>
              </div>

              {/* Component Scores */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Score Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Review Score</span>
                    <Badge>{selectedRep.scores?.reviews?.averageRating?.toFixed(1) || 0} ⭐</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <Badge>{selectedRep.scores?.performance?.completionRate || 0}%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <Badge>{selectedRep.scores?.reviews?.totalReviews || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Total Endorsements</span>
                    <Badge>{selectedRep.scores?.endorsements?.totalEndorsements || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Jobs Completed</span>
                    <Badge>{selectedRep.stats?.totalJobsCompleted || 0}</Badge>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Verification Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRep.trustIndicators && Object.entries(selectedRep.trustIndicators).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      {value ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              {selectedRep.achievements?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRep.achievements.map((ach: any, i: number) => (
                      <Badge key={i} className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1.5">
                        <Award size={14} className="mr-1 inline" /> {ach.type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Adjustment Form */}
              <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Adjust Score</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                    <select
                      value={adjustField}
                      onChange={(e) => setAdjustField(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="overallScore">Overall Score</option>
                      <option value="localTrustScore">Local Trust Score</option>
                      <option value="skillTrustScore">Skill Trust Score</option>
                      <option value="scores.reviews.score">Review Score</option>
                      <option value="scores.performance.completionRate">Completion Rate</option>
                      <option value="stats.totalJobsCompleted">Jobs Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (can be negative)</label>
                    <Input
                      type="number"
                      value={adjustValue}
                      onChange={(e) => setAdjustValue(e.target.value)}
                      placeholder="e.g., 10 or -5"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Why are you making this adjustment?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRep(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdjust}
                      disabled={isAdjusting || !adjustValue || !adjustReason.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isAdjusting ? 'Saving...' : 'Save Adjustment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
