import React from 'react';
import { Menu, Shield, Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const AdminHeader = ({ onMenuClick, title = "Admin Governance Dashboard" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/admin/complaints?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b border-[#e2d7cd] bg-white sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
            NyaySetu Official Administrative & Complaint Oversight Portal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Case ID or Keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] w-56 transition-all"
          />
        </form>

        {/* Public Board Shortcut */}
        <Link
          to="/public/complaints"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#DC4712] hover:bg-orange-50 border border-[#e2d7cd] rounded-lg transition-colors"
          title="View Anonymized Public Board"
        >
          <Shield className="w-3.5 h-3.5 text-[#EE712B]" />
          <span>Public Board</span>
        </Link>

        {/* Admin Identity Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="hidden xl:block text-left">
            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
              {user?.full_name || 'Admin'}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">
              ● Server Connected
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
