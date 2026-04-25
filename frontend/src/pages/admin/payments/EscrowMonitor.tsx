import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchEscrowOverview, fetchPaymentStats, holdEscrow, unholdEscrow, type AdminEscrowOverview, type AdminPaymentStats } from '@/lib/adminApi';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function EscrowMonitor() {
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<AdminEscrowOverview>({
    queryKey: ['admin-escrow'],
    queryFn: fetchEscrowOverview,
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminPaymentStats>({
    queryKey: ['admin-payment-stats'],
    queryFn: fetchPaymentStats,
    refetchInterval: 30000,
  });

  const refreshPanels = async () => {
    await Promise.all([refetch(), refetchStats()]);
  };

  const handleHold = async (id: string) => {
    const reason = prompt("Enter reason for holding this escrow:");
    if (!reason) return;
    setActingId(id);
    try {
      await holdEscrow(id, reason);
      toast({ title: "Escrow held", description: "Payment is now frozen." });
      await refreshPanels();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const handleUnhold = async (id: string) => {
    setActingId(id);
    try {
      await unholdEscrow(id);
      toast({ title: "Escrow released", description: "Payment hold removed." });
      await refreshPanels();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Escrow Monitor</h1>
        <p className="text-gray-600 text-sm">
          Live view of contract funds held in escrow. Amounts are based on job price; card
          processing fees are paid separately by clients.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Client Payments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${statsLoading ? '...' : (stats?.totalActualClientCharges || stats?.totalClientPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Total charged on Stripe (job price + card fees).</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Stripe Fees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${statsLoading ? '...' : (stats?.totalActualStripeFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Actual card processing fees deducted by Stripe.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">In Escrow</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${statsLoading ? '...' : (stats?.totalNetAmountHeld || stats?.totalInEscrow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Net amount locked & waiting for freelancers.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Platform Fees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${statsLoading ? '...' : (stats?.totalActualPlatformFees || stats?.totalPlatformFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Total platform service fees earned.</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <DollarSign size={24} className="text-blue-600" />
          <span className="text-gray-600 text-sm">Total Held in Escrow</span>
        </div>
        <p className="text-4xl font-bold text-gray-900">
          ${isLoading ? '...' : (data?.totalHeld || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-gray-600 text-sm mt-1">{isLoading ? 0 : (data?.contracts || []).length} active escrow contracts</p>
      </div>

      <div className="space-y-3">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />) :
          (data?.contracts || []).map(c => {
            const client = c.clientId;
            const freelancer = c.freelancerId;
            const amount = c.amount || { currency: c.financials?.currency || 'USD', total: c.financials?.contractAmount || 0 };
            const financials = c.financials;
            const currency = financials?.currency || amount.currency;
            const jobPrice = financials?.contractAmount ?? amount.total ?? 0;
            const freelancerNet = financials?.freelancerNetAmount ?? jobPrice;
            const clientTotal = financials?.clientTotal ?? jobPrice;
            const platformFee = financials?.platformFeeAmount ?? 0;
            const paymentStatus = (c.paymentStatus || financials?.paymentStatus || 'escrow').toLowerCase();
            const transactionStatus = financials?.transactionStatus || (c.isHeldByAdmin ? 'held' : undefined);
            const disputed = paymentStatus === 'disputed' || c.status === 'disputed';

            return (
              <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 font-medium">{c.title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      <span className="font-medium">{client.name}</span> <span className="text-gray-400 mx-1">→</span> <span className="font-medium">{freelancer.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${disputed ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {paymentStatus}
                      </span>
                      {transactionStatus && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${transactionStatus === 'held' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {transactionStatus}
                        </span>
                      )}
                      {c.isHeldByAdmin && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Held by Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-gray-900 font-bold font-mono">{currency} {freelancerNet.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">Freelancer Net</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Client Paid: <span className="font-semibold text-gray-900">{currency} {clientTotal.toLocaleString()}</span></p>
                      <p className="text-[11px] text-gray-500">Platform Fee: {currency} {platformFee.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {c.isHeldByAdmin && (
                        <span className="text-red-700 bg-red-100 flex items-center gap-1 text-xs px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> Held
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${disputed ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {disputed ? 'Frozen' : 'In Escrow'}
                      </span>
                    </div>

                    {c.isHeldByAdmin ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs px-2 py-0" 
                        disabled={actingId === c._id}
                        onClick={() => handleUnhold(c._id)}
                      >
                        {actingId === c._id ? 'Processing...' : 'Unhold Payment'}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-7 text-xs px-2 py-0 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 shadow-none" 
                        disabled={actingId === c._id}
                        onClick={() => handleHold(c._id)}
                      >
                        {actingId === c._id ? 'Processing...' : 'Hold Payment'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
