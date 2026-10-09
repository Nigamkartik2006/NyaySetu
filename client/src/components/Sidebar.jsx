import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  Search, 
  ShieldAlert, 
  FolderLock, 
  User, 
  LogOut,
  Eye
} from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Report Incident', path: '/student/report', icon: AlertTriangle },
    { name: 'My Complaints', path: '/student/complaints', icon: FileText },
    { name: 'Track Cases', path: '/student/track', icon: Search },
    { name: 'Public Cases', path: '/public/complaints', icon: Eye },
    { name: 'Report Retaliation', path: '/student/retaliation', icon: ShieldAlert, comingSoon: true },
    { name: 'Evidence Vault', path: '/student/evidence', icon: FolderLock, comingSoon: true },
    { name: 'Profile', path: '/student/profile', icon: User, comingSoon: true },
  ];

  return (
    <aside className="w-64 bg-[#F1E9E3] border-r border-[#e2d7cd] flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        <div className="px-3 pt-2 pb-1 border-b border-[#e2d7cd]">
          <p className="text-[11px] font-extrabold tracking-wider text-[#DC4712] uppercase">
            Student Navigation
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#EE712B] text-white shadow-sm'
                    : 'text-slate-700 hover:text-[#DC4712] hover:bg-white/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.comingSoon && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-500 font-semibold border border-[#e2d7cd]">
                  Soon
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#e2d7cd]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
