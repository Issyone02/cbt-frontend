import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface Overview { totalExams: number; totalStudents: number; totalAttempts: number; passedAttempts: number; passRate: number; }
interface ExamReport { id: string; title: string; totalQuestions: number; passingScorePercent: number; totalAttempts: number; passCount: number; failCount: number; passRate: number; avgScore: number; highScore: number; lowScore: number; }
interface StudentReport { id: string; name: string; email: string; studentId: string | null; department: string | null; totalAttempts: number; passCount: number; failCount: number; avgScore: number; bestScore: number; recentAttempts: { examTitle: string; percentage: number; isPassed: boolean; submittedAt: string }[]; }
interface QuestionReport { index: number; id: string; text: string; type: string; points: number; totalAnswered: number; correctCount: number; wrongCount: number; correctPercent: number; difficulty: 'Easy' | 'Medium' | 'Hard'; }

type Tab = 'overview' | 'exams' | 'students' | 'questions';

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct = (n: number) => `${n.toFixed(1)}%`;
const diffColor = (d: string) => d === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : d === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
const scoreColor = (s: number) => s >= 70 ? 'text-green-600 dark:text-green-400' : s >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pctValue = Math.min(100, (value / max) * 100);
  const color = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pctValue}%` }} />
      </div>
      <span className={`text-xs font-medium w-10 text-right ${scoreColor(value)}`}>{value.toFixed(1)}%</span>
    </div>
  );
}

// ── Export to CSV ─────────────────────────────────────────────────────────────
function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-gray-500 dark:text-gray-400">{msg}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const overview = useQuery<Overview>({ queryKey: ['reports-overview'], queryFn: () => api.get('/admin/reports/overview').then(r => r.data) });
  const exams    = useQuery<ExamReport[]>({ queryKey: ['reports-exams'], queryFn: () => api.get('/admin/reports/exams').then(r => r.data) });
  const students = useQuery<StudentReport[]>({ queryKey: ['reports-students'], queryFn: () => api.get('/admin/reports/students').then(r => r.data) });
  const questions = useQuery<QuestionReport[]>({
    queryKey: ['reports-questions', selectedExamId],
    queryFn: () => api.get(`/admin/reports/exams/${selectedExamId}/questions`).then(r => r.data),
    enabled: !!selectedExamId
  });

  const o = overview.data;
  const examList = exams.data || [];
  const studentList = (students.data || []).filter(s => {
    const match = `${s.name} ${s.email} ${s.studentId || ''} ${s.department || ''}`.toLowerCase().includes(studentSearch.toLowerCase());
    if (!match) return false;
    if (studentFilter === 'passed') return s.passCount > 0;
    if (studentFilter === 'failed') return s.failCount > 0 && s.passCount === 0;
    return true;
  });

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview',  label: 'Overview',       icon: '📊' },
    { key: 'exams',     label: 'Exam Reports',    icon: '📝' },
    { key: 'students',  label: 'Student Reports', icon: '👥' },
    { key: 'questions', label: 'Question Analysis', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Reports & Analytics</h1>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Grand Issyone Hotel CBT System</span>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {overview.isLoading ? <LoadingSpinner /> : (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Exams',    value: o?.totalExams,    icon: '📝', colorClass: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Total Students', value: o?.totalStudents, icon: '👥', colorClass: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Total Attempts', value: o?.totalAttempts, icon: '📋', colorClass: 'text-indigo-600 dark:text-indigo-400' },
                    { label: 'Passed',         value: o?.passedAttempts,icon: '✅', colorClass: 'text-green-600 dark:text-green-400' },
                    { label: 'Pass Rate',      value: o?.passRate ? `${o.passRate}%` : '—', icon: '🎯', colorClass: (o?.passRate ?? 0) >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
                  ].map(k => (
                    <div key={k.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center shadow-sm">
                      <div className="text-2xl mb-1">{k.icon}</div>
                      <div className={`text-2xl font-bold ${k.colorClass}`}>{k.value ?? '—'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Quick exam summary table */}
                {exams.data && exams.data.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">Exam Performance Summary</h2>
                      <button onClick={() => setTab('exams')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View full report →</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <tr>
                            <th className="text-left px-4 py-3">Exam</th>
                            <th className="text-left px-4 py-3">Attempts</th>
                            <th className="text-left px-4 py-3">Pass Rate</th>
                            <th className="text-left px-4 py-3">Avg Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {exams.data.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{e.title}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{e.totalAttempts}</td>
                              <td className="px-4 py-3 w-48"><ScoreBar value={e.passRate} /></td>
                              <td className={`px-4 py-3 font-semibold ${scoreColor(e.avgScore)}`}>{pct(e.avgScore)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── EXAM REPORTS TAB ── */}
        {tab === 'exams' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{examList.length} exam{examList.length !== 1 ? 's' : ''}</p>
              <button
                onClick={() => exportCSV('exam-reports.csv',
                  ['Exam','Questions','Attempts','Passed','Failed','Pass Rate','Avg Score','High Score','Low Score'],
                  examList.map(e => [e.title, e.totalQuestions, e.totalAttempts, e.passCount, e.failCount, `${e.passRate}%`, `${e.avgScore}%`, `${e.highScore}%`, `${e.lowScore}%`])
                )}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors">
                ⬇ Export CSV
              </button>
            </div>
            {exams.isLoading ? <LoadingSpinner /> : examList.length === 0 ? <EmptyState msg="No exam data yet. Students need to complete exams first." /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examList.map(e => (
                  <div key={e.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{e.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{e.totalQuestions} questions · pass at {e.passingScorePercent}%</p>
                      </div>
                      <button onClick={() => { setSelectedExamId(e.id); setTab('questions'); }}
                        className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        Analysis →
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: 'Attempts', value: e.totalAttempts, color: 'text-gray-800 dark:text-gray-100' },
                        { label: 'Passed',   value: e.passCount,    color: 'text-green-600 dark:text-green-400' },
                        { label: 'Failed',   value: e.failCount,    color: 'text-red-600 dark:text-red-400' },
                        { label: 'Pass Rate',value: `${e.passRate}%`,color: e.passRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
                      ].map(s => (
                        <div key={s.label} className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg py-3">
                          <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {e.totalAttempts > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Average Score</span><span className={scoreColor(e.avgScore)}>{pct(e.avgScore)}</span>
                        </div>
                        <ScoreBar value={e.avgScore} />
                        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <span>Lowest: <span className="text-red-500 dark:text-red-400 font-medium">{pct(e.lowScore)}</span></span>
                          <span>Highest: <span className="text-green-600 dark:text-green-400 font-medium">{pct(e.highScore)}</span></span>
                        </div>
                      </div>
                    )}
                    {e.totalAttempts === 0 && <p className="text-xs text-gray-500 dark:text-gray-400 italic">No attempts yet</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STUDENT REPORTS TAB ── */}
        {tab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-1 flex-wrap">
                <input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by name, email, student ID, department..."
                  value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  value={studentFilter} onChange={e => setStudentFilter(e.target.value as any)}>
                  <option value="all">All Students</option>
                  <option value="passed">Has Passed</option>
                  <option value="failed">Not Passed Yet</option>
                </select>
              </div>
              <button
                onClick={() => exportCSV('student-reports.csv',
                  ['Name','Email','Student ID','Department','Attempts','Passed','Failed','Avg Score','Best Score'],
                  (students.data || []).map(s => [s.name, s.email, s.studentId || '', s.department || '', s.totalAttempts, s.passCount, s.failCount, `${s.avgScore}%`, `${s.bestScore}%`])
                )}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors">
                ⬇ Export CSV
              </button>
            </div>
            {students.isLoading ? <LoadingSpinner /> : studentList.length === 0 ? <EmptyState msg="No student data found." /> : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <tr>
                        <th className="text-left px-4 py-3">Student</th>
                        <th className="text-left px-4 py-3">Department</th>
                        <th className="text-left px-4 py-3">Attempts</th>
                        <th className="text-left px-4 py-3">Results</th>
                        <th className="text-left px-4 py-3">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {studentList.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.department || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.totalAttempts}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <span className="text-green-600 dark:text-green-400 font-medium">{s.passCount}P</span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-red-600 dark:text-red-400 font-medium">{s.failCount}F</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 w-48"><ScoreBar value={s.avgScore} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QUESTION ANALYSIS TAB ── */}
        {tab === 'questions' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Analyze Exam:</label>
              <select className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedExamId || ''} onChange={e => setSelectedExamId(e.target.value || null)}>
                <option value="">Select an exam...</option>
                {examList.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>

            {!selectedExamId ? <EmptyState msg="Select an exam above to see question-level difficulty analysis." /> :
              questions.isLoading ? <LoadingSpinner /> : (questions.data || []).length === 0 ? <EmptyState msg="No attempts for this exam yet." /> : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <tr>
                          <th className="text-left px-4 py-3">#</th>
                          <th className="text-left px-4 py-3">Question Text</th>
                          <th className="text-left px-4 py-3">Difficulty</th>
                          <th className="text-left px-4 py-3">Success Rate</th>
                          <th className="text-left px-4 py-3">Correct</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {questions.data?.map(q => (
                          <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 text-gray-400 font-medium">{q.index}</td>
                            <td className="px-4 py-3">
                              <p className="text-gray-900 dark:text-gray-100 line-clamp-2 max-w-md">{q.text}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${diffColor(q.difficulty)}`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-3 w-40">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${q.correctPercent}%` }} />
                                </div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{q.correctPercent}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {q.correctCount} / {q.totalAnswered}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}
