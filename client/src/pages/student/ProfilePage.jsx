import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import {
  User,
  ShieldCheck,
  Mail,
  IdCard,
  Key,
  FileText,
  CheckCircle2,
  Clock,
  FolderLock,
  Lock,
  Edit3,
  Save,
  Loader2,
  AlertTriangle,
  Calendar,
  ShieldAlert
} from 'lucide-react';

const ProfilePage = () => {
  const { user: authUser, setUser } = useAuth();
  const [profile, setProfile] = useState(authUser || {});
  const [stats, setStats] = useState({
    total_complaints: 0,
    resolved_complaints: 0,
    active_complaints: 0,
    total_evidence: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit'

  // Edit Form State
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setProfile(res.user);
        setFullName(res.user.full_name || '');
        if (setUser) setUser(res.user);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('[ProfilePage fetchProfileData error]:', err);
      setErrorMsg(err.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        full_name: fullName
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmPassword = confirmPassword;
      }

      const res = await authApi.updateProfile(payload);
      if (res.success && res.user) {
        setSuccessMsg(res.message || 'Profile updated successfully!');
        setProfile(res.user);
        if (setUser) setUser(res.user);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('[handleUpdateProfile error]:', err);
      setErrorMsg(err.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu — Student Profile & Identity Security" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">

          {/* Profile Identity Banner */}
          <div className="bg-white border border-[#e2d7cd] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EE712B] to-[#DC4712] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                {(profile.full_name || 'S').charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    {profile.full_name || 'Student User'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#DC4712] border border-orange-200">
                    {profile.role || 'Student'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Account Active
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <IdCard className="w-3.5 h-3.5 text-slate-400" />
                    ID: <strong className="text-slate-800 font-mono">{profile.student_id || 'N/A'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#EE712B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Profile Overview
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'edit'
                    ? 'bg-[#EE712B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Security Settings</span>
              </button>
            </div>
          </div>

          {/* Activity Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Filed</span>
                <FileText className="w-4 h-4 text-[#EE712B]" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.total_complaints}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Grievances submitted</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.resolved_complaints}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Completed investigations</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Cases</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.active_complaints}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Under review / active</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Vault Storage</span>
                <FolderLock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.total_evidence}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Encrypted attachments</span>
            </div>
          </div>

          {/* Feedback Banners */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Tab Content */}
          {loading ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center text-slate-600">
              <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">Loading student profile data...</p>
            </div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-6">

              {/* Identity & Account Card */}
              <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#EE712B]" />
                    Official Identity Information
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">Verified System Record</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Full Registered Name</span>
                    <p className="text-slate-900 font-extrabold text-sm">{profile.full_name}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Student / Enrollment Roll Number</span>
                    <p className="text-slate-900 font-mono font-extrabold text-sm">{profile.student_id || 'N/A'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Primary Registered Email</span>
                    <p className="text-slate-900 font-extrabold text-sm">{profile.email}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Portal Access Role</span>
                    <p className="text-slate-900 font-extrabold text-sm capitalize">{profile.role}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Registration Date</span>
                    <p className="text-slate-900 font-extrabold text-sm flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(profile.created_at)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Account Security Status</span>
                    <p className="text-emerald-700 font-extrabold text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified & SHA-256 Protected
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Decoupling Architecture Card */}
              <div className="bg-gradient-to-br from-orange-50/50 to-white border border-orange-200/80 rounded-xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[#DC4712]">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="text-sm font-extrabold">Student Identity Privacy Assurance</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  NyaySetu employs strict identity decoupling architecture. When you submit a complaint or report retaliation, your full name and student ID are strictly encrypted and separated from public transparency feeds. Public boards display only your cryptographically generated Case ID (<span className="font-mono font-bold text-slate-900">CMP-XXXX</span>) and "Anonymous Student".
                </p>
              </div>

            </div>
          ) : (
            /* Security Settings Tab */
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#EE712B]" />
                  Security & Account Preferences
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your display name or change your account password.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
                {/* Full Name Edit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Full Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Enter full name"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
                    />
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Change Account Password (Optional)
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required only if changing password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Updates...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
