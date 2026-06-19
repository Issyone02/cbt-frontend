import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MyResults() {
  const navigate = useNavigate();

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['myResults'],
    queryFn: () => api.get('/my-results').then(r => r.data)
  });

  const passed = results.filter((r: any) => r.isPassed).length;
  const failed = results.length - passed;
  const avgScore = results.length
    ? (results.reduce((sum: number, r: any) => sum + r.percentage, 0) / results.length).toFixed(1)
    : null;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">My Results</h1>
      </div>
      <div className="p-8 text-red-600 dark:text-red-400">Failed to load results. Please try again.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">My Results</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {results.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-800 dark:text-gray-100 font-medium">No exam results yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">You haven't completed any exams yet.</p>
            <Link to="/exams" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              View Available Exams
            </Link>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Exams Taken', value: results.length, color: 'text-gray-800 dark:text-gray-100' },
                { label: 'Passed',      value: passed,         color: 'text-green-600 dark:text-green-400' },
                { label: 'Failed',      value: failed,         color: 'text-red-600 dark:text-red-400' },
                { label: 'Avg Score',   value: avgScore ? `${avgScore}%` : '—', color: parseFloat(avgScore || '0') >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center shadow-sm">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Results list */}
            <div className="space-y-3">
              {results.map((res: any) => (
                <div key={res.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{res.attempt.exam.title}</h2>
                      <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold
                        ${res.isPassed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {res.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(res.computedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Score: <strong>{res.obtainedPoints} / {res.totalPoints}</strong>
                      </span>
                      <span className={`font-bold text-lg ${res.percentage >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {res.percentage.toFixed(1)}%
                      </span>
                    </div>
                    {/* Score bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden w-full max-w-xs">
                      <div
                        className={`h-full rounded-full ${res.isPassed ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, res.percentage)}%` }}
                      />
                    </div>
                  </div>
                  <Link to={`/review/${res.attemptId}`}
                    className="shrink-0 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
