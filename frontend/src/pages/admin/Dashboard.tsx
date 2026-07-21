import React, { useEffect, useState } from 'react';
import { Users, Wallet, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminMenuItems } from '../../data/mockData';
import { formatCurrency, formatDate, resolveStatus } from '../../utils/formatUtils';
import api from '../../utils/axios';
import {
  BentoStat,
  FeaturedBalanceCard,
  AreaOverviewCard,
  DarkTable,
  DarkStatusBadge,
} from '../../components/dashboard/DarkBento';

interface DashboardData {
  totalUsers: number;
  totalBalance: number;
  totalPayout: number;
  todayPayout: number;
  totalPayin: number;
  todayPayin: number;
  totalProfit: number;
  todayProfit: number;
  last7DaysData: Array<{
    date: string;
    payout: number;
    payin: number;
    profit: number;
  }>;
  recentPayoutTransactions: Array<{
    transaction_id: string;
    amount: number;
    status: string;
    reference_id: string;
    created_at: string;
    user_name: string;
    user_email: string;
    beneficiary_name: string;
    account_number: string;
    bank_name: string;
    total_charges: number;
    remark: string;
  }>;
}


const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setDashboardData(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart series built from the real last-7-days data returned by the API
  const payinChartData =
    dashboardData?.last7DaysData.map((item) => ({
      name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(item.payin) || 0,
    })) || [];

  const payoutChartData =
    dashboardData?.last7DaysData.map((item) => ({
      name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(item.payout) || 0,
    })) || [];

  const balanceChartData =
    dashboardData?.last7DaysData.map((item) => ({
      name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(item.profit) || 0,
    })) || [];

  const recentTransactions =
    dashboardData?.recentPayoutTransactions.map((t) => ({
      id: t.transaction_id,
      user: t.user_name,
      amount: t.amount,
      type: 'Payout',
      date: t.created_at,
      status: t.status,
    })) || [];

  const recentPayouts =
    dashboardData?.recentPayoutTransactions.map((t) => ({
      id: t.transaction_id,
      userName: t.user_name,
      amount: t.amount,
      fee: t.total_charges,
      method: t.bank_name,
      date: t.created_at,
      status: t.status,
    })) || [];

  const transactionColumns = [
    { header: 'ID', accessor: 'id', cell: (v: string) => <span className="text-xs font-mono text-slate-500">{v}</span> },
    { header: 'User', accessor: 'user', cell: (v: string) => <span className="font-medium text-white">{v}</span> },
    { header: 'Amount', accessor: 'amount', cell: (v: number) => <span className="font-semibold text-white">{formatCurrency(v)}</span> },
    {
      header: 'Type',
      accessor: 'type',
      cell: (v: string) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-400/10 text-indigo-300">
          {v}
        </span>
      ),
    },
    { header: 'Date', accessor: 'date', cell: (v: string) => <span className="text-slate-500">{formatDate(v)}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (v: string, row: any) => <DarkStatusBadge status={resolveStatus(v, row.date)} />,
    },
  ];

  const payoutColumns = [
    { header: 'ID', accessor: 'id', cell: (v: string) => <span className="text-xs font-mono text-slate-500">{v}</span> },
    { header: 'User', accessor: 'userName', cell: (v: string) => <span className="font-medium text-white">{v}</span> },
    { header: 'Amount', accessor: 'amount', cell: (v: number) => <span className="font-semibold text-white">{formatCurrency(v)}</span> },
    { header: 'Fee', accessor: 'fee', cell: (v: number) => <span className="text-slate-400">{formatCurrency(v)}</span> },
    { header: 'Method', accessor: 'method', cell: (v: string) => <span className="text-slate-400">{v || '—'}</span> },
    { header: 'Date', accessor: 'date', cell: (v: string) => <span className="text-slate-500">{formatDate(v)}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (v: string, row: any) => <DarkStatusBadge status={resolveStatus(v, row.date)} />,
    },
  ];

  const totalPayin = Number(dashboardData?.totalPayin) || 0;
  const totalPayout = Number(dashboardData?.totalPayout) || 0;
  const todayPayin = Number(dashboardData?.todayPayin) || 0;
  const todayPayout = Number(dashboardData?.todayPayout) || 0;

  return (
    <DashboardLayout menuItems={adminMenuItems} title="Admin Dashboard">
      {/* Full-bleed dark cinematic canvas — scoped to this page only */}
      <div
        className="-m-4 sm:-m-6 p-4 sm:p-6 min-h-[calc(100%+3rem)]"
        style={{ background: 'radial-gradient(circle at top left, #111a30 0%, #0B1120 55%)' }}
      >
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <p className="text-sm text-slate-400">Real-time overview of your platform</p>
        </div>

        {/* ---------------- Bento Grid: Metrics ---------------- */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"
          style={{ gridAutoFlow: 'dense' }}
        >
          <FeaturedBalanceCard
            value={Number(dashboardData?.totalBalance) || 0}
            chartData={balanceChartData}
            icon={Wallet}
            className="col-span-2 row-span-2"
          />

          <BentoStat title="Total Users" value={Number(dashboardData?.totalUsers) || 0} icon={Users} color="#60a5fa" isCurrency={false} />
          <BentoStat title="Total Payin" value={totalPayin} icon={ArrowDownCircle} color="#fbbf24" />
          <BentoStat title="Total Payout" value={totalPayout} icon={ArrowUpCircle} color="#f87171" />
          <BentoStat title="Total Profit" value={Number(dashboardData?.totalProfit) || 0} icon={TrendingUp} color="#a78bfa" />
          <BentoStat title="Today's Payin" value={todayPayin} icon={ArrowDownCircle} color="#facc15" />
          <BentoStat title="Today's Payout" value={todayPayout} icon={ArrowUpCircle} color="#fb7185" />
          <BentoStat title="Today's Profit" value={Number(dashboardData?.todayProfit) || 0} icon={TrendingDown} color="#34d399" />
        </div>

        {/* ---------------- Area chart overview cards ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <AreaOverviewCard
            title="Payin Overview"
            value={formatCurrency(totalPayin)}
            trendValue={Number((((todayPayin) / (totalPayin || 1)) * 100).toFixed(2))}
            chartData={payinChartData}
            color="#22d3ee"
          />
          <AreaOverviewCard
            title="Payout Overview"
            value={formatCurrency(totalPayout)}
            trendValue={Number((((todayPayout) / (totalPayout || 1)) * 100).toFixed(2))}
            chartData={payoutChartData}
            color="#a78bfa"
          />
        </div>

        {/* ---------------- Tables ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DarkTable title="Recent Transactions" columns={transactionColumns} data={recentTransactions} loading={loading} />
          <DarkTable title="Recent Payouts" columns={payoutColumns} data={recentPayouts} loading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;