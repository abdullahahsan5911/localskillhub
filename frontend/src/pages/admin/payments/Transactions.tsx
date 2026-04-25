import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactions } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Search, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';

export default function Transactions() {
  const [search, setSearch] = useState('');
  // Use expandedRow to toggle details inline
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', search],
    queryFn: () => fetchTransactions({ search }),
  });

  const transactions = (data as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Transactions</h1>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Platform-wide Transaction History
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Shows real Stripe-sourced amounts. Search by Stripe ID, user email, name, etc.
          </p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by Stripe ID, email, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50 border-gray-300 pl-10 text-gray-900"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
             <TableHeader className="border-gray-200">
              <TableRow>
                <TableHead className="text-gray-600">Date/Type</TableHead>
                <TableHead className="text-gray-600">Contract</TableHead>
                <TableHead className="text-gray-600 text-right">Client Paid</TableHead>
                <TableHead className="text-gray-600 text-center">Status</TableHead>
                <TableHead className="text-gray-600 text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx: any) => (
                  <React.Fragment key={tx._id}>
                    <TableRow 
                      className="border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === tx._id ? null : tx._id)}
                    >
                      <TableCell>
                        <div className="text-sm text-gray-900 mb-1">
                          {format(new Date(tx.createdAt), 'MMM d, p')}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {tx.type === 'escrow_lock' ? (
                            <Wallet className="h-3 w-3 text-amber-600" />
                          ) : tx.type === 'escrow_release' ? (
                            <ArrowUpRight className="h-3 w-3 text-blue-600" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3 text-red-600" />
                          )}
                          <span className="text-gray-600 capitalize">
                            {tx.type?.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-gray-900 truncate max-w-[200px]" title={tx.contractTitle || 'N/A'}>
                          {tx.contractTitle || 'Unknown Contract'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                          {tx.sender?.name || 'System'} → {tx.receiver?.name || (tx.type === 'escrow_lock' ? 'Escrow' : 'System')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono font-medium text-gray-900">
                          ${tx.clientTotal?.toFixed(2) || tx.amount?.toFixed(2)}
                        </div>
                        {tx.actualStripeFee > 0 && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            incl. ${tx.actualStripeFee.toFixed(2)} stripe fee
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          'capitalize text-[10px] px-1.5 py-0',
                          tx.status === 'released' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 
                          tx.status === 'refunded' ? 'bg-red-50 text-red-700 hover:bg-red-100' :
                          tx.status === 'held' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
                          'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-blue-600 group-hover:underline">
                          {expandedRow === tx._id ? 'Hide' : 'View'}
                        </span>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Detail Row */}
                    {expandedRow === tx._id && (
                      <TableRow className="bg-gray-50/50">
                        <TableCell colSpan={5} className="p-0 border-b">
                          <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                            <div className="space-y-2">
                              <p className="font-medium text-gray-900 border-b pb-1">Stripe References</p>
                              <div className="grid grid-cols-3 gap-1 items-center text-xs">
                                <span className="text-gray-500">Charge:</span>
                                <span className="col-span-2 font-mono text-gray-700 truncate">
                                  {tx.stripeChargeId ? (
                                    <a href={`https://dashboard.stripe.com/charges/${tx.stripeChargeId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {tx.stripeChargeId}
                                    </a>
                                  ) : '-'}
                                </span>
                                
                                <span className="text-gray-500">Intent:</span>
                                <span className="col-span-2 font-mono text-gray-700 truncate">
                                  {tx.stripePaymentIntentId ? (
                                    <a href={`https://dashboard.stripe.com/payments/${tx.stripePaymentIntentId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {tx.stripePaymentIntentId}
                                    </a>
                                  ) : '-'}
                                </span>

                                <span className="text-gray-500">Transfer:</span>
                                <span className="col-span-2 font-mono text-gray-700 truncate">
                                  {tx.stripeTransferId ? (
                                    <a href={`https://dashboard.stripe.com/transfers/${tx.stripeTransferId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {tx.stripeTransferId}
                                    </a>
                                  ) : '-'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="font-medium text-gray-900 border-b pb-1">Financial Breakdown</p>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Client Paid (Total)</span>
                                  <span className="font-mono">${tx.clientTotal?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">- Stripe Fee (Actual)</span>
                                  <span className="font-mono text-red-600">-${tx.actualStripeFee?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs border-b border-gray-200 pb-1">
                                  <span className="text-gray-500">- Platform Fee</span>
                                  <span className="font-mono text-green-600">${tx.platformFee?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium pt-1">
                                  <span className="text-gray-700">Freelancer Net</span>
                                  <span className="font-mono text-blue-600">${tx.netAmount?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            
                             <div className="space-y-2">
                              <p className="font-medium text-gray-900 border-b pb-1">Participants</p>
                              <div className="space-y-1 text-xs">
                                <div>
                                  <span className="text-gray-500 block">Sender ({tx.sender?.name})</span>
                                  <span className="font-mono text-gray-600 truncate block">{tx.sender?._id || '-'}</span>
                                </div>
                                <div className="pt-1">
                                  <span className="text-gray-500 block">Receiver ({tx.receiver?.name})</span>
                                  <span className="font-mono text-gray-600 truncate block">{tx.receiver?._id || '-'}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

