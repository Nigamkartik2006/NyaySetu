import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Loader2, AlertTriangle, PieChart, Calendar } from 'lucide-react';
import { adminApi } from '../../services/api';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    categories: [],
    statuses: [],
    timeline: [],
    dangerMetrics: []
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getAnalytics();
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error('[AdminAnalyticsPage error]:', err);
      setError(err.message || 'Failed to load system analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin" />
        <p className="text-xs text-slate-600 font-bold">Computing MySQL analytics & metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-900 space-y-3 max-w-lg mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-extrabold">Failed to Load Analytics</h3>
        <p className="text-xs font-medium text-rose-700">{error}</p>
      </div>
    );
  }

  const totalCasesCount = analytics.categories.reduce((acc, c) => acc + Number(c.count), 0);

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#EE712B]" />
          <span>System Governance Analytics</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Comprehensive complaint statistics and trends computed directly from MySQL database tables
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category Breakdown */}
        <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-4 h-4 text-[#EE712B]" />
            <span>Category Distribution</span>
          </h2>

          <div className="space-y-3">
            {analytics.categories.map((c) => {
              const pct = totalCasesCount > 0 ? Math.round((c.count / totalCasesCount) * 100) : 0;
              return (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{c.category}</span>
                    <span className="font-mono text-[#DC4712]">{c.count} cases ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-[#EE712B] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Status Breakdown</span>
          </h2>

          <div className="space-y-3">
            {analytics.statuses.map((s) => {
              const pct = totalCasesCount > 0 ? Math.round((s.count / totalCasesCount) * 100) : 0;
              return (
                <div key={s.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{s.status}</span>
                    <span className="font-mono text-purple-700">{s.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Timeline Trend Chart Card */}
      <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Submissions Over Time (MySQL Daily Aggregate)</span>
        </h2>

        {analytics.timeline.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-4 text-center">No submission timeline data recorded.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {analytics.timeline.map((item) => (
              <div key={item.date} className="bg-[#F1E9E3] border border-[#e2d7cd] p-3 rounded-lg text-center">
                <span className="text-[10px] font-mono text-slate-500 font-bold block">
                  {new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono block mt-1">
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-600 font-semibold block">case(s)</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAnalyticsPage;
