import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { toast } from 'react-hot-toast';

interface Provider {
  name: string;
  display_name: string;
  enabled: boolean;
  mode: 'test' | 'live';
  payin_enabled: boolean;
  payout_enabled: boolean;
  is_active: boolean;
  adapter_status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'NOT_REGISTERED';
  updated_at: string;
}

export default function PaymentSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const res = await api.get('/admin/payment-providers');
      setProviders(res.data.providers || []);
    } catch {
      toast.error('Failed to load payment providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleActivate = async (name: string) => {
    setSaving(name);
    try {
      await api.post(`/admin/payment-providers/${name}/activate`);
      toast.success(`${name} activated`);
      fetchProviders();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Activation failed';
      toast.error(msg);
    } finally {
      setSaving(null);
    }
  };

  const handleDeactivate = async (name: string) => {
    setSaving(name);
    try {
      await api.post(`/admin/payment-providers/${name}/deactivate`);
      toast.success(`${name} deactivated`);
      fetchProviders();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Deactivation failed';
      toast.error(msg);
    } finally {
      setSaving(null);
    }
  };

  const handleModeChange = async (name: string, mode: 'test' | 'live') => {
    try {
      await api.put(`/admin/payment-providers/${name}`, { mode });
      toast.success(`${name} switched to ${mode} mode`);
      setProviders(prev => prev.map(p => p.name === name ? { ...p, mode } : p));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update mode');
    }
  };

  const statusColor = (status: string) => {
    if (status === 'CONFIGURED') return 'text-green-500';
    return 'text-yellow-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Loading payment providers…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payment Settings</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Configure payment providers. Credentials are set via environment variables — not stored here.
        </p>
      </div>

      {providers.length === 0 && (
        <div className="rounded-xl bg-gray-800 p-6 text-gray-400 text-center">
          No payment providers found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(provider => (
          <div
            key={provider.name}
            className="rounded-xl bg-gray-800 border border-gray-700 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg">{provider.display_name}</h2>
                <span className={`text-xs font-medium ${statusColor(provider.adapter_status)}`}>
                  {provider.adapter_status === 'CONFIGURED' ? '● Configured' : '● Not Configured (Stub)'}
                </span>
              </div>
              {provider.is_active && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">
                  ACTIVE
                </span>
              )}
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">Mode:</span>
              <div className="flex gap-2">
                {(['test', 'live'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(provider.name, m)}
                    disabled={saving === provider.name}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      provider.mode === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Status pills */}
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full ${provider.payin_enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                Payin: {provider.payin_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${provider.payout_enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                Payout: {provider.payout_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {provider.adapter_status !== 'CONFIGURED' && (
              <p className="text-xs text-amber-400 bg-amber-900/30 border border-amber-800 rounded px-3 py-2">
                This provider is not yet implemented. Set the required environment variables and redeploy to enable.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              {!provider.is_active ? (
                <button
                  onClick={() => handleActivate(provider.name)}
                  disabled={saving === provider.name || provider.adapter_status !== 'CONFIGURED'}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {saving === provider.name ? 'Activating…' : 'Activate'}
                </button>
              ) : (
                <button
                  onClick={() => handleDeactivate(provider.name)}
                  disabled={saving === provider.name}
                  className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                >
                  {saving === provider.name ? 'Deactivating…' : 'Deactivate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
        <h3 className="text-white font-medium mb-2">Important Notes</h3>
        <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li>API credentials (keys, secrets) are configured via environment variables — never stored in the database.</li>
          <li>Activating a provider requires environment variables to be set and the container redeployed.</li>
          <li>Only one provider can be active at a time. Activating a new one deactivates the current one.</li>
          <li>When no provider is active, all payment endpoints return <code className="text-amber-400">PAYMENT_PROVIDER_NOT_CONFIGURED</code>.</li>
        </ul>
      </div>
    </div>
  );
}
