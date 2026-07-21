import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Shared glass-card shell                                          */
/* ------------------------------------------------------------------ */
export const GlassCard: React.FC<{
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ className = '', children, style }) => (
  <div
    className={`relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] ${className}`}
    style={style}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Small glow-icon badge                                            */
/* ------------------------------------------------------------------ */
const GlowIcon: React.FC<{ icon: LucideIcon; color: string }> = ({ icon: Icon, color }) => (
  <div
    className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
    style={{
      background: `${color}1A`,
      boxShadow: `0 0 18px ${color}55`,
    }}
  >
    <Icon className="h-4.5 w-4.5" style={{ color }} size={18} />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Small bento stat card                                            */
/* ------------------------------------------------------------------ */
export const BentoStat: React.FC<{
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  className?: string;
  isCurrency?: boolean;
}> = ({ title, value, icon, color, className = '', isCurrency = true }) => {
  const display =
    isCurrency
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0)
      : (Number(value) || 0).toLocaleString();

  return (
    <GlassCard className={`p-4 flex flex-col justify-between hover:bg-white/[0.06] transition-colors duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-tight max-w-[70%]">{title}</p>
        <GlowIcon icon={icon} color={color} />
      </div>
      <p className="text-xl font-bold text-white tabular-nums truncate">{display}</p>
    </GlassCard>
  );
};

/* ------------------------------------------------------------------ */
/*  Featured "Total Balance" card with sparkline                     */
/* ------------------------------------------------------------------ */
export const FeaturedBalanceCard: React.FC<{
  value: number;
  chartData: { name: string; value: number }[];
  icon: LucideIcon;
  className?: string;
}> = ({ value, chartData, icon: Icon, className = '' }) => {
  const display = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);

  return (
    <GlassCard className={`p-6 flex flex-col justify-between overflow-hidden relative ${className}`}>
      {/* ambient glow */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ background: '#22d3ee' }} />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Balance</p>
          <p className="text-3xl font-extrabold text-white tabular-nums">{display}</p>
        </div>
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #22d3ee33, #6366f133)', boxShadow: '0 0 25px #22d3ee44' }}
        >
          <Icon className="h-6 w-6 text-cyan-300" />
        </div>
      </div>

      <div className="h-20 mt-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#22d3ee' }}
            />
            <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#balanceGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

/* ------------------------------------------------------------------ */
/*  Overview card with segmented range control + area chart          */
/* ------------------------------------------------------------------ */
const RANGES = ['7D', '30D', '1Y'] as const;

export const AreaOverviewCard: React.FC<{
  title: string;
  value: string;
  trendValue?: number;
  chartData: { name: string; value: number }[];
  color: string;
}> = ({ title, value, trendValue, chartData, color }) => {
  const [range, setRange] = useState<typeof RANGES[number]>('7D');

  // Data is only available for the last 7 days from the API. For the 30D / 1Y
  // toggle we reuse the same dataset (visual preview) so functionality/data
  // fetching is not affected — only the active tab UI changes.
  const gradientId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>

        {/* segmented control */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                range === r ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        {trendValue !== undefined && (
          <span className={`text-xs font-semibold ${trendValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendValue >= 0 ? '+' : ''}{trendValue}%
          </span>
        )}
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" hide />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color }}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

/* ------------------------------------------------------------------ */
/*  Dark pill status badge                                           */
/* ------------------------------------------------------------------ */
export const DarkStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || '').toLowerCase();
  const map: Record<string, string> = {
    completed: 'bg-emerald-400/10 text-emerald-400',
    success: 'bg-emerald-400/10 text-emerald-400',
    approved: 'bg-emerald-400/10 text-emerald-400',
    resolved: 'bg-emerald-400/10 text-emerald-400',
    active: 'bg-emerald-400/10 text-emerald-400',
    pending: 'bg-amber-400/10 text-amber-400',
    failed: 'bg-red-400/10 text-red-400',
    rejected: 'bg-red-400/10 text-red-400',
    cancelled: 'bg-red-400/10 text-red-400',
    inactive: 'bg-slate-400/10 text-slate-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${map[s] || 'bg-slate-400/10 text-slate-400'}`}>
      {s || 'unknown'}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Borderless dark table                                            */
/* ------------------------------------------------------------------ */
export interface DarkColumn {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => React.ReactNode;
}

export const DarkTable: React.FC<{
  title: string;
  columns: DarkColumn[];
  data: any[];
  loading?: boolean;
}> = ({ title, columns, data, loading }) => {
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, ri) => (
                <tr key={ri} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
                  {columns.map((col, ci) => (
                    <td key={ci} className="px-5 py-3.5 text-sm text-slate-300 whitespace-nowrap">
                      {col.cell ? col.cell(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};
