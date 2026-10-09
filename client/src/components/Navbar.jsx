import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = ({ title = "NyaySetu" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'official':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'student':
      default:
        return 'bg-orange-100 text-[#DC4712] border-orange-300';
    }
  };

  return (
    <header className="h-16 border-b-2 border-[#EE712B] bg-white sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm">
      {/* Official NyayaSetu Brand Logo */}
      <Link to="/" className="flex items-center gap-3">
        <img
          src="/logo.jpg"
          alt="NyayaSetu Logo"
          className="h-11 w-auto object-contain rounded-lg border border-[#e2d7cd]"
        />
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-slate-600">
            {title}
          </p>
        </div>
      </Link>

      {/* User Credentials & Logout */}
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-3 bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg px-3.5 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#DC4712] text-white flex items-center justify-center text-xs font-bold">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.full_name}
                </div>
                <div className="flex items-center gap-2 text-[10px] mt-0.5">
                  <span className={`capitalize font-bold border px-1.5 py-0.2 rounded ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                  {user.student_id && (
                    <span className="text-slate-600 font-semibold">ID: {user.student_id}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#DC4712] bg-white hover:bg-orange-50 border border-slate-300 rounded-lg transition-colors shadow-sm"
              title="Logout from portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
