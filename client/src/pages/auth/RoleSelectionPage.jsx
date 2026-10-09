import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Building2, ShieldAlert, ArrowRight, Lock } from 'lucide-react';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      icon: GraduationCap,
      description: 'Report incidents, submit complaints and track your cases.',
      tag: 'Public Registration Allowed',
      badgeColor: 'bg-orange-100 text-[#DC4712] border-orange-200',
      allowRegister: true
    },
    {
      id: 'official',
      title: 'College Official',
      icon: Building2,
      description: 'Review complaints and take appropriate institutional action.',
      tag: 'Institutional Access Only',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      allowRegister: false
    },
    {
      id: 'admin',
      title: 'Admin',
      icon: ShieldAlert,
      description: 'Monitor the platform, accountability and system-level activity.',
      tag: 'System Governance',
      badgeColor: 'bg-amber-100 text-amber-200 border-amber-200',
      allowRegister: false
    }
  ];

  const handleSelectRole = (roleId) => {
    navigate(`/login?role=${roleId}`);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] text-slate-900 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Banner */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b-2 border-[#EE712B]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="NyayaSetu Official Logo"
            className="h-14 sm:h-16 w-auto object-contain rounded-lg border border-[#e2d7cd]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-[#F1E9E3] border border-[#e2d7cd] px-3.5 py-1.5 rounded-lg">
          <Lock className="w-4 h-4 text-[#DC4712]" />
          <span>Institutional Access Control</span>
        </div>
      </header>

      {/* Main Role Selection Area */}
      <main className="max-w-5xl mx-auto w-full my-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Select User Portal
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Official NyaySetu Portal. Select your role to proceed to secure login.
          </p>
        </div>

        {/* 3 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white border border-[#e2d7cd] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#EE712B] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-[#F1E9E3] border border-[#e2d7cd] flex items-center justify-center text-[#DC4712]">
                    <role.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] px-2.5 py-1 rounded border font-bold ${role.badgeColor}`}>
                    {role.tag}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                  "{role.description}"
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#e2d7cd]">
                <button
                  onClick={() => handleSelectRole(role.id)}
                  className="w-full py-3 px-4 rounded-lg font-bold text-xs text-white bg-[#EE712B] hover:bg-[#DC4712] flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>Continue as {role.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {role.allowRegister ? (
                  <div className="text-center">
                    <Link
                      to="/register"
                      className="text-xs text-[#DC4712] hover:text-[#EE712B] font-bold hover:underline"
                    >
                      New Student Registration
                    </Link>
                  </div>
                ) : (
                  <p className="text-[11px] text-center text-slate-500 font-semibold">
                    Authorized Credentials Required
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-[#e2d7cd] text-xs text-slate-600 font-semibold">
        NyayaSetu &copy; {new Date().getFullYear()} — A Safer Campus for Every Student
      </footer>
    </div>
  );
};

export default RoleSelectionPage;
