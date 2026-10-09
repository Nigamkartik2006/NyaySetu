import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Building2, ShieldAlert, Lock, Mail, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const initialRole = searchParams.get('role') || 'student';
  const [selectedRole, setSelectedRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['student', 'official', 'admin'].includes(roleParam)) {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'official') navigate('/official/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(formData.email, formData.password, selectedRole);
      if (loggedUser.role === 'student') navigate('/student/dashboard');
      else if (loggedUser.role === 'official') navigate('/official/dashboard');
      else if (loggedUser.role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      if (err.message.includes('authorized') || err.message.includes('role')) {
        setError('You are not authorized to access this role.');
      } else if (err.message.includes('Invalid') || err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'official', label: 'Official', icon: Building2 },
    { id: 'admin', label: 'Admin', icon: ShieldAlert }
  ];

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center mb-3">
            <img
              src="/logo.jpg"
              alt="NyayaSetu Official Logo"
              className="h-20 sm:h-24 w-auto object-contain rounded-xl border border-[#e2d7cd]"
            />
          </Link>
          <h2 className="text-xl font-bold text-slate-800">
            Portal User Sign In
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Official NyaySetu Portal Authentication
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 sm:p-8 shadow-sm">
          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
              Selected Portal Role
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[#F1E9E3] p-1.5 rounded-lg border border-[#e2d7cd]">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r.id);
                    setError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded font-bold text-xs transition-colors ${
                    selectedRole === r.id
                      ? 'bg-[#EE712B] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <r.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={
                    selectedRole === 'student'
                      ? 'student@campusguard.edu'
                      : selectedRole === 'official'
                      ? 'official@campusguard.edu'
                      : 'admin@campusguard.edu'
                  }
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EE712B] focus:ring-1 focus:ring-[#EE712B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EE712B] focus:ring-1 focus:ring-[#EE712B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as {selectedRole.toUpperCase()}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-[#e2d7cd] text-center">
            {selectedRole === 'student' ? (
              <p className="text-xs text-slate-600 font-medium">
                Don't have a student account?{' '}
                <Link to="/register" className="text-[#DC4712] font-bold hover:underline">
                  Register here
                </Link>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-semibold">
                Official and Admin accounts are provisioned by institutional administration.
              </p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-900 font-bold">
            ← Return to Role Selection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
