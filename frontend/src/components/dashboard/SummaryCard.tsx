import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { getIconByName } from '../../data/mockData';
import { formatCurrency, formatPercentage } from '../../utils/formatUtils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  percentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  isCurrency?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  percentage,
  trend = 'neutral',
  icon,
  color = 'primary',
  isCurrency = true,
}) => {
  const Icon = getIconByName(icon);

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };
  
  const displayValue = isCurrency 
    ? formatCurrency(value)
    : value.toLocaleString();

  const getAccentColor = () => {
    const map: Record<string, { from: string; to: string; text: string; bg: string }> = {
      blue:    { from: '#3b82f6', to: '#6366f1', text: 'text-blue-600',    bg: 'bg-blue-50' },
      primary: { from: '#6366f1', to: '#8b5cf6', text: 'text-indigo-600',  bg: 'bg-indigo-50' },
      success: { from: '#10b981', to: '#059669', text: 'text-emerald-600', bg: 'bg-emerald-50' },
      warning: { from: '#f59e0b', to: '#d97706', text: 'text-amber-600',   bg: 'bg-amber-50' },
      error:   { from: '#ef4444', to: '#dc2626', text: 'text-red-600',     bg: 'bg-red-50' },
      purple:  { from: '#8b5cf6', to: '#7c3aed', text: 'text-purple-600',  bg: 'bg-purple-50' },
      orange:  { from: '#f97316', to: '#ea580c', text: 'text-orange-600',  bg: 'bg-orange-50' },
    };
    return map[color] || map.blue;
  };

  const accent = getAccentColor();

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100 group relative overflow-hidden">
      {/* Subtle gradient bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{displayValue}</p>
          {percentage !== undefined && (
            <div className="flex items-center mt-2">
              {getTrendIcon()}
              <span className={`text-xs font-semibold ml-1 ${getTrendColor()}`}>
                {formatPercentage(percentage)}
              </span>
              <span className="text-xs text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${accent.bg} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${accent.text}`} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;