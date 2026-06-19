import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  passingScorePercent: number;
  negativeMarkingPercent?: number;
  shuffleQuestions: boolean;
  isPublished: boolean;
  questions: any[];
}

type AvailStatus = 'live' | 'upcoming' | 'ended' | 'unpublished';

function getStatus(exam: Exam): AvailStatus {
  if (!exam.isPublished) return 'unpublished';
  const now = new Date();
  const start = new Date(exam.startTime);
  const end = new Date(exam.endTime);
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'live';
}

const statusLabel: Record<AvailStatus, { label: string; className: string; dot: string }> = {
  live:        { label: 'Live',       className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-700',  dot: 'bg-green-500' },
  upcoming:    { label: 'Upcoming',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-700',    dot: 'bg-blue-400' },
  ended:       { label: 'Ended',      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600',    dot: 'bg-gray-500' },
  unpublished: { label: 'Unpublished',className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-200 dark:border-orange-700',dot: 'bg-orange-400' },
};

export default function ViewExams() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [extendTarget, setExtendTarget] = useState<Exam | null>(null);
  const [extendHours, setExtendHours] = useState(24);
  const [filterStatus, setFilterStatus] = useState<AvailStatus | 'all'>('all');

  const { data: exams = [], isLoading, error } = useQuery<Exam[]>({
    queryKey: ['allExams'],
    queryFn: async () => {
      const res = await api.get('/admin/exams');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (examId: string) => api.delete(`/admin/exams/${examId}`),
    onSuccess: () => { toast.success('Exam deleted'); queryClient.invalidateQueries({ queryKey: ['allExams'] }); },
    onError: () => toast.error('Delete failed')
  });

  const publishMutation = useMutation({
    mutationFn: ({ examId, isPublished }: { examId: string; isPublished: boolean }) =>
      api.patch(`/admin/exams/${examId}/publish`, { isPublished }),
    onSuccess: (_, { isPublished }) => {
      toast.success(isPublished ? 'Exam published — students can now see it' : 'Exam unpublished');
      queryClient.invalidateQueries({ queryKey: ['allExams'] });
    },
    onError: () => toast.error('Failed to update publish status')
  });

  const extendMutation = useMutation({
    mutationFn: ({ examId, hours }: { examId: string; hours: number }) =>
      api.patch(`/admin/exams/${examId}/extend`, { hours }),
    onSuccess: () => {
      toast.success(`Exam extended — now live and open for ${extendHours} hour(s)`);
      setExtendTarget(null);
      queryClient.invalidateQueries({ queryKey: ['allExams'] });
    },
    onError: () => toast.error('Failed to extend exam window')
  });

  const filtered = filterStatus === 'all' ? exams : exams.filter(e => getStatus(e) === filterStatus);

  const counts = {
    all: exams.length,
    live: exams.filter(e => getStatus(e) === 'live').length,
    upcoming: exams.filter(e => getStatus(e) === 'upcoming').length,
    ended: exams.filter(e => getStatus(e) === 'ended').length,
    unpublished: exams.filter(e => getStatus(e) === 'unpublished').length,
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">Error loading exams.</p>
        <button onClick={() => navigate('/admin')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">← Back to Dashboard</button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manage Examinations</h1>
        </div>
        <Link to="/admin/exams/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20">
          + Create Exam
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm w-fit">
          {(['all', 'live', 'upcoming', 'ended', 'unpublished'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                ${filterStatus === s 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {s} <span className="ml-1 opacity-50">({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Info banner if no live exams */}
        {counts.live === 0 && filterStatus === 'all' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-2xl px-6 py-5 flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider text-xs mb-1">Attention Required</p>
              <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                No exams are currently live. Students can only see <strong>Published</strong> exams within their active time window.
                To make an exam visible now, click <strong>Publish</strong> then <strong>Make Live Now</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Exams table */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
          {filtered.length === 0 ? (
            <div className="p-20 text-center">
              <div className="text-5xl mb-4">📂</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No exams found in this category.</p>
              {filterStatus !== 'all' && <button onClick={() => setFilterStatus('all')} className="mt-4 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs hover:underline">Show all exams</button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Examination Details</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Time Window</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Stats</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filtered.map((exam) => {
                    const st = getStatus(exam);
                    const { label, className, dot } = statusLabel[st];
                    return (
                      <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{exam.title}</p>
                          {exam.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 max-w-xs">{exam.description}</p>}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-2 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${className}`}>
                            <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`}></span>
                            {label}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{new Date(exam.startTime).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Ends: {new Date(exam.endTime).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{exam.questions?.length || 0} Questions</span>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{exam.durationMinutes} Minutes</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => publishMutation.mutate({ examId: exam.id, isPublished: !exam.isPublished })}
                              className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all
                                ${exam.isPublished
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                              {exam.isPublished ? '✓ Published' : '○ Draft'}
                            </button>

                            {(st === 'ended' || st === 'upcoming') && (
                              <button onClick={() => { setExtendTarget(exam); setExtendHours(24); }}
                                className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-600 text-white font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20">
                                Go Live
                              </button>
                            )}

                            <Link to={`/admin/exams/${exam.id}/questions`}
                              className="text-[10px] px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-wider hover:bg-indigo-100 transition-all">
                              Questions
                            </Link>
                            <Link to={`/admin/exams/${exam.id}/edit`}
                              className="text-[10px] px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-black uppercase tracking-wider hover:bg-gray-200 transition-all">
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${exam.title}"? This action cannot be undone.`))
                                  deleteMutation.mutate(exam.id);
                              }}
                              className="text-[10px] px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-black uppercase tracking-wider hover:bg-rose-100 transition-all">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Extend / Make Live modal ── */}
      {extendTarget && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl mb-6">⚡</div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-xl mb-2">Make Exam Live</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              This will set <strong>"{extendTarget.title}"</strong> to start immediately and stay open for the selected duration.
            </p>
            
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-3">Availability Window</label>
            <div className="grid grid-cols-3 gap-2 mb-8">
              {[1, 2, 4, 8, 24, 48].map(h => (
                <button key={h} onClick={() => setExtendHours(h)}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border
                    ${extendHours === h 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>
                  {h}h
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setExtendTarget(null)}
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button
                onClick={() => extendMutation.mutate({ examId: extendTarget.id, hours: extendHours })}
                disabled={extendMutation.isPending}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                {extendMutation.isPending ? 'Processing...' : 'Activate Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
