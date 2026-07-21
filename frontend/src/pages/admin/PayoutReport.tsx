import React, { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Table from '../../components/dashboard/Table';
import { adminMenuItems } from '../../data/mockData';
import { formatCurrency, formatDate, getStatusColor, resolveStatus } from '../../utils/formatUtils';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

interface PayoutTransaction {
  transaction_id: string;
  reference_id: string;
  user_name: string;
  beneficiary_name: string;
  account_number: string;
  bank_name: string;
  amount: number;
  total_charges: number;
  remark: string;
  status: string;
  created_at: string;
}

export default function PayoutReport() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [transactions, setTransactions] = useState<PayoutTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDate) params.date = selectedDate;
      const response = await api.get('/admin/wallet-transactions', { params });
      const data = response.data?.data || response.data || [];
      setTransactions(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch payout report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleDownload = () => {
    const headers = ['Transaction ID', 'Reference ID', 'User', 'Beneficiary', 'Account No', 'Bank', 'Amount', 'Charges', 'Status', 'Date'];
    const rows = transactions.map(t => [
      t.transaction_id,
      t.reference_id,
      t.user_name,
      t.beneficiary_name,
      t.account_number,
      t.bank_name,
      t.amount,
      t.total_charges,
      resolveStatus(t.status, t.created_at),
      new Date(t.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-report-${selectedDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'transaction_id',
      cell: (value: string) => <span className="font-medium text-indigo-600 text-xs">{value || '—'}</span>,
    },
    {
      header: 'User',
      accessor: 'user_name',
      cell: (value: string) => <span className="font-medium">{value || '—'}</span>,
    },
    {
      header: 'Beneficiary',
      accessor: 'beneficiary_name',
      cell: (value: string) => value || '—',
    },
    {
      header: 'A/C No',
      accessor: 'account_number',
      cell: (value: string) => <span className="font-mono text-xs">{value || '—'}</span>,
    },
    {
      header: 'Bank',
      accessor: 'bank_name',
      cell: (value: string) => value || '—',
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (value: number) => <span className="font-semibold">{formatCurrency(value)}</span>,
    },
    {
      header: 'Charges',
      accessor: 'total_charges',
      cell: (value: number) => <span className="text-gray-500">{formatCurrency(value)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: string, row: any) => {
        const resolved = resolveStatus(value, row.created_at);
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value, row.created_at)}`}>
            {resolved.charAt(0).toUpperCase() + resolved.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessor: 'created_at',
      cell: (value: string) => <span className="text-xs text-gray-500">{value ? formatDate(value) : '—'}</span>,
    },
  ];

  return (
    <DashboardLayout menuItems={adminMenuItems} title="Payout Report">
      <div className="space-y-5">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Filter by Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchPayouts}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {loading ? 'Loading...' : 'Apply Filter'}
              </button>

              <button
                onClick={handleDownload}
                disabled={transactions.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary pills */}
        {fetched && (
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total', count: transactions.length, color: 'bg-indigo-50 text-indigo-700' },
              { label: 'Success', count: transactions.filter(t => resolveStatus(t.status, t.created_at) === 'completed' || resolveStatus(t.status, t.created_at) === 'success').length, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Pending', count: transactions.filter(t => resolveStatus(t.status, t.created_at) === 'pending').length, color: 'bg-amber-50 text-amber-700' },
              { label: 'Failed', count: transactions.filter(t => resolveStatus(t.status, t.created_at) === 'failed').length, color: 'bg-red-50 text-red-700' },
            ].map(s => (
              <span key={s.label} className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                {s.label}: {s.count}
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <Table
          columns={columns}
          data={transactions}
          title="Payout Transactions"
          description="All payout transactions across users"
          searchable={true}
          filterable={false}
          pagination={true}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}