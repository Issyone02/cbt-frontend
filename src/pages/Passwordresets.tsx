import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ResetRequest {
  id: string;
  resetCode: string;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentId: string | null;
  };
}

export default function PasswordResets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const { data: requests = [], isLoading, refetch } = useQuery<ResetRequest[]>({
    queryKey: ['passwordResets'],
    queryFn: () => api.get('/admin/password-resets').then(r => r.data),
    // Auto-refresh every 30 seconds so new requests appear without manual reload
    refetchInterval: 30000,
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/password-resets/${id}`),
    onSuccess: () => {
      toast.success('Request dismissed');
      queryClient.invalidateQueries({ queryKey: ['passwordResets'] });
    },
    onError: () => toast.error('Failed to dismiss request')
  });

  const timeLeft = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / 3600000);
    const mins  = Math.floor((ms % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
  };

  const isExpiring = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    return ms > 0 && ms < 3 * 3600000; // less than 3 hours
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">← Back to Dashboard</button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Password Reset Requests</h1>
          {requests.length > 0 && (
            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {requests.length} pending
            </span>
          )}
        </div>
        <button onClick={() => refetch()}
          className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-1.5">
          ↻ Refresh
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* How it works banner */}
        <div className="bg-gray-900 dark:bg-gray-800 border border-gray-800 dark:border-gray-700 rounded-3xl p-8 shadow-xl">
          <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-[0.2em]">Security Protocol</h3>
          <ol className="text-sm text-gray-400 dark:text-gray-300 space-y-3 list-decimal list-inside leading-relaxed">
            <li>A user clicks <strong className="text-indigo-400 font-bold">"Forgot Password"</strong> and enters their email.</li>
            <li>Their request appears here with a <strong className="text-indigo-400 font-bold">6-digit reset code</strong>.</li>
            <li>Reveal the code and give it to the user <strong className="text-white">directly</strong> (in person or secure message).</li>
            <li>The user enters their email, the code, and a new password on the login page.</li>
            <li>Dismiss the request here once the user has successfully regained access.</li>
          </ol>
        </div>

        {/* Request list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-16 text-center shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">All clear!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              There are no pending password reset requests at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden transition-all hover:shadow-2xl">
                <div className="p-6">
                  {/* User info */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {req.user.firstName} {req.user.lastName}
                      </p>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{req.user.email}</p>
                      <div className="mt-2">
                        {req.user.studentId
                          ? <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg uppercase tracking-wider">Student: {req.user.studentId}</span>
                          : <span className="text-[10px] font-black bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-lg uppercase tracking-wider">Lecturer</span>
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Requested At</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {new Date(req.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${isExpiring(req.expiresAt) ? 'text-rose-500' : 'text-gray-400'}`}>
                        {isExpiring(req.expiresAt) ? '⚠️ ' : ''}{timeLeft(req.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {/* Reset code reveal */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black mb-3 uppercase tracking-[0.2em]">6-Digit Reset Code</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[150px]">
                        {revealed[req.id] ? (
                          <span className="font-mono text-4xl font-black tracking-[0.4em] text-blue-600 dark:text-blue-400 select-all">
                            {req.resetCode}
                          </span>
                        ) : (
                          <span className="font-mono text-4xl font-black tracking-[0.4em] text-gray-300 dark:text-gray-700 select-none">
                            ••••••
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRevealed(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                          className={`text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-widest transition-all shadow-sm
                            ${revealed[req.id]
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'}`}>
                          {revealed[req.id] ? 'Hide' : 'Reveal'}
                        </button>
                        {revealed[req.id] && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(req.resetCode);
                              toast.success('Code copied to clipboard');
                            }}
                            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white uppercase tracking-widest transition-all shadow-lg shadow-green-500/20">
                            Copy
                          </button>
                        )}
                      </div>
                    </div>
                    {revealed[req.id] && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-widest mb-2">Instructions for User</p>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed border border-gray-100 dark:border-gray-800">
                          "Go to the login page, click 'Forgot Password', then click 'Enter Reset Code'. Enter your email <strong className="text-gray-900 dark:text-gray-100">{req.user.email}</strong>, the code <strong className="text-blue-600 dark:text-blue-400">{req.resetCode}</strong>, and your new password."
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (confirm(`Dismiss reset request for ${req.user.firstName} ${req.user.lastName}?\n\nOnly dismiss this if the user has already reset their password.`))
                          dismissMutation.mutate(req.id);
                      }}
                      disabled={dismissMutation.isPending}
                      className="text-[10px] font-black px-4 py-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50">
                      Dismiss Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
