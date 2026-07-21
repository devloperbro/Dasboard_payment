import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, User, Bell, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { MenuItem } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  menuItems,
  title
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex">
        <Sidebar 
          items={menuItems} 
          isOpen={true} 
          onClose={() => {}} 
        />
      </div>

      {/* Sidebar for mobile - overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
            onClick={toggleSidebar}
          />
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <Sidebar 
              items={menuItems} 
              isOpen={true} 
              onClose={toggleSidebar} 
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 z-10 shadow-none">
          <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-1.5 cursor-default border border-gray-100">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.user_type}</p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;