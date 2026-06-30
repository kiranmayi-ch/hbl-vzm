import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Factory, Globe, List, TrendingUp,
  FileText, MessageSquare, Settings, Shield, LogOut,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout, isAdmin, isSectionUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { path: '/my-section', label: 'My Section', icon: Factory, show: isSectionUser || isAdmin },
    { path: '/plant-overview', label: 'Plant Overview', icon: Globe, show: true },
    { path: '/all-sections', label: 'All Sections', icon: List, show: true },
    { path: '/trends', label: 'Monthly Trends', icon: TrendingUp, show: true },
    { path: '/reports', label: 'Reports', icon: FileText, show: true },
    { path: '/whatsapp', label: 'WhatsApp Reports', icon: MessageSquare, show: true },
    { divider: true, show: isAdmin },
    { path: '/admin', label: 'Admin Panel', icon: Shield, show: isAdmin },
    { path: '/settings', label: 'Settings', icon: Settings, show: true },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Zap size={24} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="brand-title">HBL Engineering</span>
            <span className="brand-subtitle">MEC Dashboard</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.filter(item => item.show).map((item, idx) => {
          if (item.divider) {
            return <div key={idx} className="sidebar-divider" />;
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Badge */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className={`badge badge-${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        )}

        <button className="sidebar-link logout-btn" onClick={logout} title="Logout">
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
