import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Eye, Edit, Settings, RefreshCw, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminMenuItems } from '../../data/mockData';
import Table from '../../components/dashboard/Table';
import api from '../../utils/axios';
import { toast } from 'react-hot-toast';

export default function ManageUser() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Sr No.',
      accessor: 'id',
      cell: (value: number) => (
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'User Type',
      accessor: 'userType',
      cell: (value: any) => {
        if (!value) return <span className="text-gray-500">-</span>;
        const formattedValue = String(value).toLowerCase();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formattedValue === 'admin' ? 'bg-primary-100 text-primary-800' :
            formattedValue === 'agent' ? 'bg-secondary-100 text-secondary-800' :
              'bg-gray-100 text-gray-800'
            }`}>
            {formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Username',
      accessor: 'username',
      cell: (value: any) => value || <span className="text-gray-500">-</span>
    },
    {
      header: 'Wallet Balance',
      accessor: 'walletBalance',
      cell: (value: any) => (
        <span className="font-medium text-gray-900">₹{Number(value || 0).toFixed(2)}</span>
      ),
    },
    {
      header: 'Mobile',
      accessor: 'mobile',
      cell: (value: any) => value || <span className="text-gray-500">-</span>
    },
    {
      header: 'Payin',
      accessor: 'payin',
      cell: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Boolean(value) ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
          }`}>
          {Boolean(value) ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Payout',
      accessor: 'payout',
      cell: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Boolean(value) ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
          }`}>
          {Boolean(value) ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: any) => {
        if (!value) return <span className="text-gray-500">-</span>;
        const formattedValue = String(value).toLowerCase();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formattedValue === 'active' ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
            }`}>
            {formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (value: number) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/admin/manage-user/${value}`)}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="View User"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/manage-user/${value}/edit`)}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            title="Edit User"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/manage-user/${value}/charges`)}
            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            title="User Charges"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/manage-user/${value}/callbacks`)}
            className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
            title="Manage Callbacks"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/manage-user/${value}/add-fund`)}
            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            title="Add Fund"
          >
            <Wallet className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout menuItems={adminMenuItems} title="Manage Users">
      <div className="space-y-6">
        {/* Header with Add User button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <Link
            to="/admin/manage-user/add"
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add User
          </Link>
        </div>

        {/* User Table */}
        <Table
          columns={columns}
          data={users}
          title="User List"
          description="Manage all registered users and their settings"
          searchable={true}
          filterable={true}
          pagination={true}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}