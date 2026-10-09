import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CountdownTimer = ({ createdAt, isEscalated, status, timeoutMinutes = 2 }) => {
  const calculateRemaining = () => {
    if (!createdAt) return 0;
    const created = new Date(createdAt).getTime();
    const deadline = created + timeoutMinutes * 60 * 1000;
    const now = new Date().getTime();
    const diffSeconds = Math.floor((deadline - now) / 1000);
    return Math.max(0, diffSeconds);
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateRemaining());

  useEffect(() => {
    setSecondsLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, timeoutMinutes]);

  const isCompleted = ['Action Taken', 'Resolved', 'Closed'].includes(status);
  const isOverdue = secondsLeft <= 0 || isEscalated === 1 || status === 'Escalated';

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Official Action Recorded</span>
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold text-rose-900 bg-rose-100 border border-rose-300 rounded-full animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span>OVERDUE (ESCALATED)</span>
      </span>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft < 45;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-extrabold rounded-full border shadow-sm
      ${isWarning 
        ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 
        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
      }
    `}>
      <Clock className={`w-3.5 h-3.5 ${isWarning ? 'text-amber-600' : 'text-emerald-600'}`} />
      <span>
        {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
      </span>
    </span>
  );
};

export default CountdownTimer;
