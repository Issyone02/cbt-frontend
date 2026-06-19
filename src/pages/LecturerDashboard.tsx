import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ThemeToggle';

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const [tab, setTab] = useState<'exams' | 'results'>('exams');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Load all exams (read-only — lecturers can manage questions but not create/delete exams)
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['lecturer-exams'],
    queryFn: () => api.get('/admin/exams').then(r => r.data)
  });

  // Load all submitted attempts for results viewing
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['lecturer-attempts'],
    queryFn: () => api.get('/admin/attempts').then(r => r.data),
    enabled: tab === 'results'
  });

  // Filter attempts by selected exam
  const filteredAttempts = selectedExamId
    ? attempts.filter((a: any) => a.examId === selectedExamId)
    : attempts;

  const passed = filteredAttempts.filter((a: any) => a.result?.isPassed).length;
  const avgScore = filteredAttempts.length
    ? (filteredAttempts.reduce((sum: number, a: any) => sum + (a.result?.percentage || 0), 0) / filteredAttempts.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Lecturer Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={async () => { await logout(); navigate('/login'); }}
            className="text-sm bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-medium transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-1">
          {[
            { key: 'exams',   label: '📝 Manage Questions' },
            { key: 'results', label: '📊 View Results' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ── MANAGE QUESTIONS TAB ── */}
        {tab === 'exams' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-3 text-sm text-blue-600 dark:text-blue-400">
              As a lecturer, you can add, edit, and delete questions on any exam. Contact an administrator to create or delete exams.
            </div>

            {examsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : exams.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 dark:text-gray-400">No exams available yet. An administrator needs to create exams first.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {exams.map((exam: any) => {
                  const now = new Date();
                  const isLive = exam.isPublished && new Date(exam.startTime) <= now && new Date(exam.endTime) >= now;
                  return (
                    <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{exam.title}</h3>
                          {exam.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{exam.description}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2
                          ${isLive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {isLive ? '🟢 Live' : '○ Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span>⏱ {exam.durationMinutes} min</span>
                        <span>❓ {exam.questions?.length || 0} questions</span>
                        <span>✅ Pass at {exam.passingScorePercent}%</span>
                      </div>
                      <Link to={`/admin/exams/${exam.id}/questions`}
                        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                        Manage Questions →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW RESULTS TAB ── */}
        {tab === 'results' && (
          <div className="space-y-4">
            {/* Exam filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter by Exam:</label>
              <select className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedExamId || ''}
                onChange={e => setSelectedExamId(e.target.value || null)}>
                <option value="">All Exams</option>
                {exams.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>

            {/* Summary cards */}
            {filteredAttempts.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Attempts', value: filteredAttempts.length, color: 'text-gray-800 dark:text-gray-100' },
                  { label: 'Passed', value: passed, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Avg Score', value: avgScore ? `${avgScore}%` : '—', color: 'text-blue-600 dark:text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center shadow-sm">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Results table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              {attemptsLoading ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading results...</div>
              ) : filteredAttempts.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No submitted attempts yet{selectedExamId ? ' for this exam' : ''}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        {['Student', 'Exam', 'Submitted', 'Score', 'Result'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredAttempts.map((attempt: any) => (
                        <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{attempt.student.firstName} {attempt.student.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{attempt.student.studentId || attempt.student.email}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{attempt.exam.title}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(attempt.submittedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {attempt.result?.obtainedPoints ?? '—'} / {attempt.result?.totalPoints ?? '—'}
                            {attempt.result && (
                              <span className={`ml-2 font-semibold ${attempt.result.percentage >= attempt.exam.passingScorePercent ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ({attempt.result.percentage?.toFixed(1)}%)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium
                              ${attempt.result?.isPassed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {attempt.result?.isPassed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
