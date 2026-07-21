import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MenuItem } from '../../types';
import { getIconByName } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ items = [], isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get role-specific logo text
  const getRoleTitle = () => {
    switch (user?.user_type) {
      case 'admin':
        return 'Admin Portal';
      case 'agent':
        return 'Agent Portal';
      case 'user':
        return 'User Portal';
      default:
        return 'Payvex';
    }
  };

  // Check if the current path matches the menu item path
  const isPathActive = (path: string) => {
    // For dashboard paths, require exact match
    if (path === `/${user?.user_type}`) {
      return location.pathname === path;
    }
    // For other paths, check if current path starts with the menu item path
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`w-64 flex flex-col h-full transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <div className="text-white">
              {React.createElement(getIconByName('Wallet'), { size: 18 })}
            </div>
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-wide">{getRoleTitle()}</span>
            <p className="text-slate-400 text-xs">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {(items || []).map((item) => {
            const Icon = getIconByName(item.icon);
            const active = isPathActive(item.path);

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${active
                      ? 'text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/8'
                    }
                  `}
                  style={active ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
                >
                  <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-2 px-2">
          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-slate-400 text-xs truncate capitalize">{user?.user_type || 'user'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;