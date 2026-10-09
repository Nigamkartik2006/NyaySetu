import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  Eye, 
  CheckSquare, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  BarChart3, 
  History, 
  LogOut,
  X
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'All Complaints', path: '/admin/complaints', icon: FileText },
    { name: 'Pending Cases', path: '/admin/complaints?status=Submitted', icon: Clock },
    { name: 'Under Review', path: '/admin/complaints?status=Under Review', icon: Eye },
    { name: 'Action Taken', path: '/admin/complaints?status=Action Taken', icon: CheckSquare },
    { name: 'Escalated Cases', path: '/admin/complaints?status=Escalated', icon: AlertTriangle },
    { name: 'Resolved Cases', path: '/admin/complaints?status=Resolved', icon: CheckCircle2 },
    { name: 'Retaliation Reports', path: '/admin/retaliation', icon: ShieldAlert },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: History }
  ];

  const isActive = (itemPath) => {
    if (itemPath === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    if (itemPath.includes('?')) {
      return location.pathname + location.search === itemPath;
    }
    return location.pathname.startsWith(itemPath) && !location.search;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-200 ease-in-out border-r border-slate-800 shadow-xl shrink-0
      `}>
        <div>
          {/* Header Branding */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-[#1e293b]/50">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="NyayaSetu Logo" 
                className="h-9 w-auto object-contain rounded border border-slate-700 shadow-sm"
              />
              <div>
                <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                  NyaySetu
                </span>
                <span className="text-[10px] font-bold text-[#EE712B] uppercase tracking-wider block">
                  Admin Governance
                </span>
              </div>
            </Link>

            <button 
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin User Profile Quick Info */}
          <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EE712B] flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {user?.full_name || 'System Administrator'}
              </p>
              <span className="inline-block bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 mt-0.5">
                Role: Admin
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.comingSoon ? '#' : item.path}
                  onClick={(e) => {
                    if (item.comingSoon) e.preventDefault();
                    if (onClose) onClose();
                  }}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold
                    transition-all duration-150 group
                    ${active 
                      ? 'bg-[#EE712B] text-white shadow-md shadow-orange-950/40 font-bold' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                    ${item.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.comingSoon && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-rose-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
