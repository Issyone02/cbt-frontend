import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ManageAttempts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'passed' | 'failed'>('all');

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['allAttempts'],
    queryFn: () => api.get('/admin/attempts').then(r => r.data)
  });

  const resetMutation = useMutation({
    mutationFn: (attemptId: string) => api.delete(`/admin/attempts/${attemptId}`),
    onSuccess: () => {
      toast.success('Attempt reset — student can retake the exam');
      queryClient.invalidateQueries({ queryKey: ['allAttempts'] });
    },
    onError: () => toast.error('Failed to reset attempt')
  });

  const filtered = attempts.filter((a: any) => {
    const name = `${a.student.firstName} ${a.student.lastName} ${a.student.email} ${a.exam.title}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchResult = filterResult === 'all' ? true : filterResult === 'passed' ? a.result?.isPassed : !a.result?.isPassed;
    return matchSearch && matchResult;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Manage Attempts</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center shadow-sm">
          <input
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by student name, email or exam..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            value={filterResult} onChange={e => setFilterResult(e.target.value as any)}>
            <option value="all">All Results</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} attempt{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading attempts...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {attempts.length === 0 ? 'No submitted attempts yet.' : 'No attempts match your filter.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    {['Student', 'Email', 'Exam', 'Submitted At', 'Score', 'Result', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map((attempt: any) => (
                    <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {attempt.student.firstName} {attempt.student.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{attempt.student.email}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{attempt.exam.title}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(attempt.submittedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {attempt.result?.obtainedPoints ?? '—'} / {attempt.result?.totalPoints ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium
                          ${attempt.result?.isPassed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${attempt.result?.isPassed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {attempt.result?.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm(`Reset attempt for ${attempt.student.firstName} ${attempt.student.lastName}?\n\nThis allows them to retake "${attempt.exam.title}". Their current score will be deleted.`))
                              resetMutation.mutate(attempt.id);
                          }}
                          disabled={resetMutation.isPending}
                          className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
