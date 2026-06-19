import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = [
  { key: 'ALL',      label: 'All Activity',      icon: '📋' },
  { key: 'AUTH',     label: 'Logins',             icon: '🔐' },
  { key: 'EXAM',     label: 'Exam Activity',      icon: '📝' },
  { key: 'QUESTION', label: 'Question Changes',   icon: '❓' },
  { key: 'IMPORT',   label: 'Imports',            icon: '⬆' },
  { key: 'USER',     label: 'User Management',    icon: '👥' },
  { key: 'ATTEMPT',  label: 'Attempt Resets',     icon: '🔄' },
  { key: 'SECURITY', label: 'Security Events',    icon: '🛡' },
];

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  AUTH_LOGIN:                  { label: 'Login',              color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  EXAM_CREATE:                 { label: 'Exam Created',       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  EXAM_DELETE:                 { label: 'Exam Deleted',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EXAM_PUBLISH:                { label: 'Exam Published',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  EXAM_UNPUBLISH:              { label: 'Exam Unpublished',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  EXAM_START:                  { label: 'Exam Started',       color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  EXAM_SUBMIT:                 { label: 'Exam Submitted',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  QUESTION_ADD:                { label: 'Question Added',     color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  QUESTION_DELETE:             { label: 'Question Deleted',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  IMPORT_QUESTIONS:            { label: 'Questions Imported', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  USER_CREATE:                 { label: 'User Created',       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  DELETE_USER:                 { label: 'User Deleted',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  RESET_ATTEMPT:               { label: 'Attempt Reset',      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  PASSWORD_RESET:              { label: 'Password Reset',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  ADMIN_PASSWORD_RECOVERY_CLI: { label: 'Admin Recovery',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function AuditLog() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (category !== 'ALL') params.set('category', category);
  if (fromDate) params.set('from', fromDate);
  if (toDate) params.set('to', toDate);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', category, page, fromDate, toDate],
    queryFn: () => api.get(`/admin/audit-logs?${params}`).then(r => r.data),
    refetchInterval: 60000,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const exportCSV = () => {
    const exportParams = new URLSearchParams();
    if (category !== 'ALL') exportParams.set('category', category);
    if (fromDate) exportParams.set('from', fromDate);
    if (toDate) exportParams.set('to', toDate);
    window.open(`/api/admin/audit-logs/export?${exportParams}`, '_blank');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

  const getMeta = (metadata: string) => {
    try { return JSON.parse(metadata || '{}'); } catch { return {}; }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Audit Log</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} records</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">↻ Refresh</button>
          <button onClick={exportCSV} className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">⬇ Export CSV</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => { setCategory(c.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${category === c.key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">From:</label>
            <input type="date" className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">To:</label>
            <input type="date" className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
          </div>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); setPage(1); }}
              className="text-sm text-red-600 dark:text-red-400 hover:underline">Clear dates</button>
          )}
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            Showing {logs.length} of {total} records
          </span>
        </div>

        {/* Log table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>No log entries found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    {['Timestamp', 'Event', 'User', 'Role', 'IP Address', 'Details'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {logs.map((log: any) => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
                    const meta = getMeta(log.metadata);
                    const roles = log.user?.userRoles?.map((ur: any) => ur.role.name).join(', ') || '—';
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {log.user ? (
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{log.user.firstName} {log.user.lastName}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-[10px]">{log.user.email}</p>
                            </div>
                          ) : <span className="text-gray-500 dark:text-gray-400 text-xs italic">System</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{roles}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate" title={meta.details}>
                          {meta.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
              ← Previous
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
