import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { toast } from 'react-hot-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.current_password) e.current_password = 'Current password is required';
    if (!form.new_password || form.new_password.length < 8)
      e.new_password = 'New password must be at least 8 characters';
    if (form.new_password !== form.confirm_password)
      e.confirm_password = 'Passwords do not match';
    if (form.new_password === form.current_password)
      e.new_password = 'New password must differ from current password';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password
      });
      toast.success('Password changed successfully');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Change Password</h1>
        <p className="text-gray-400 text-sm mb-6">
          Choose a strong password you haven't used before.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {[
            { name: 'current_password', label: 'Current Password' },
            { name: 'new_password', label: 'New Password' },
            { name: 'confirm_password', label: 'Confirm New Password' }
          ].map(field => (
            <div key={field.name}>
              <label className="block text-gray-300 text-sm mb-1" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete={field.name === 'current_password' ? 'current-password' : 'new-password'}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                className={`w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${
                  errors[field.name] ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                }`}
              />
              {errors[field.name] && (
                <p className="text-red-400 text-xs mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
