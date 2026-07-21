// Format currency
export const formatCurrency = (value: number | string, currency = 'INR'): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Resolve pending status: if pending > 1 hour, treat as failed
export const resolveStatus = (status: string, createdAt?: string): string => {
  if (status?.toLowerCase() === 'pending' && createdAt) {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    if (now - created > 60 * 60 * 1000) {
      return 'failed';
    }
  }
  return status?.toLowerCase() || 'unknown';
};

// Format transaction status
export const getStatusColor = (status: string, createdAt?: string): string => {
  const resolved = resolveStatus(status, createdAt);
  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    success: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    failed: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    approved: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    rejected: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    resolved: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    cancelled: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    inactive: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
    active: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  };
  return statusColors[resolved] || 'bg-gray-100 text-gray-600';
};