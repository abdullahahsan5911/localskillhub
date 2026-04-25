import { useQuery, useQueryClient } from '@tanstack/react-query';
import { approveWithdrawal, fetchWithdrawalRequests, type AdminWithdrawalRequest } from '@/lib/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

export default function WithdrawalRequests() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ success: boolean; data: AdminWithdrawalRequest[] } | any>({
    queryKey: ['admin-withdrawal-requests'],
    queryFn: fetchWithdrawalRequests,
    refetchInterval: 30000,
  });

  const requests: AdminWithdrawalRequest[] = (data as any)?.data || (data?.success ? data.data : data) || [];

  const handleApprove = async (userId: string) => {
    try {
      await approveWithdrawal(userId);
      toast({ title: 'Withdrawal approved', description: 'Stripe transfers have been initiated for this freelancer.' });
      await queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
    } catch (e: any) {
      toast({ title: 'Approval failed', description: e?.message || 'Unable to approve withdrawal', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Withdrawal Requests</h1>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Freelancers waiting for manual withdrawal approval
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Shows freelancers who have requested payouts. Approving will trigger Stripe transfers for all released earnings associated with their account.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-gray-200">
              <TableRow>
                <TableHead className="text-gray-600">Freelancer</TableHead>
                <TableHead className="text-gray-600">Email</TableHead>
                <TableHead className="text-gray-600 text-right">Requested Amount</TableHead>
                <TableHead className="text-gray-600 text-center">Contracts</TableHead>
                <TableHead className="text-gray-600 text-right">Last Activity</TableHead>
                <TableHead className="text-gray-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    Loading withdrawal requests...
                  </TableCell>
                </TableRow>
              ) : !requests.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No pending withdrawal requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.userId as string} className="border-gray-200">
                    <TableCell>{req.user?.name || req.userId}</TableCell>
                    <TableCell className="text-sm text-gray-600">{req.user?.email || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-gray-900">
                      ${req.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-700">{req.txCount}</TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {req.latestAt ? format(new Date(req.latestAt), 'MMM d, p') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="h-7 text-xs px-3" onClick={() => handleApprove(req.userId)}>
                        Approve & Payout
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
