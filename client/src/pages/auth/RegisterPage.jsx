import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, Mail, IdCard, KeyRound, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (!formData.full_name || !formData.student_id || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register({
        full_name: formData.full_name,
        student_id: formData.student_id,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setSuccess('Account created successfully! Redirecting to student dashboard...');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1200);
    } catch (err) {
      if (err.message.includes('email already exists') || err.status === 409) {
        setError('An account with this email already exists.');
      } else if (err.message.includes('Student ID') || err.message.includes('ID')) {
        setError('A student account with this Student ID / Enrollment Number already exists.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col justify-center items-center p-4 py-8">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group mb-2">
            <img 
              src="/logo.jpg" 
              alt="NyayaSetu Official Logo" 
              className="h-16 w-auto object-contain rounded-lg shadow-sm border border-[#e2d7cd]"
            />
          </Link>
          <h2 className="text-xl font-bold text-slate-800">
            Student Registration Portal
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Official NyaySetu Portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 sm:p-8 shadow-sm">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Kartik Nigam"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EE712B] focus:ring-1 focus:ring-[#EE712B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student ID / Enrollment Number
              </label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="e.g. 2401430100115"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EE712B] focus:ring-1 focus:ring-[#EE712B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@campusguard.edu"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EE712B] focus:ring-1 focus:ring-[#EE712B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EE712B] focus:ring-1 focus:ring-[#EE712B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EE712B] focus:ring-1 focus:ring-[#EE712B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-3 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Registration...</span>
                </>
              ) : (
                <span>Complete Student Registration</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-4 border-t border-[#e2d7cd] text-center">
            <p className="text-xs text-slate-600 font-medium">
              Already have an account?{' '}
              <Link to="/login?role=student" className="text-[#DC4712] font-bold hover:underline">
                Sign in here
              </Link>
            </p>
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

export default RegisterPage;
