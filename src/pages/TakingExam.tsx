import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import MathRenderer from '../components/MathRenderer';
import SebRequiredNotice from '../components/SebRequiredNotice';

export default function TakingExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);

  // ── Load exam session ─────────────────────────────────────────────────────
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['examSession', examId],
    queryFn: async () => {
      // Check localStorage first (avoids duplicate start calls on re-render)
      const stored = localStorage.getItem('currentAttempt');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.submitted) {
          localStorage.removeItem('currentAttempt');
          navigate('/dashboard', { replace: true });
          throw new Error('Already submitted');
        }
        // If same exam, use stored session (preserves question order client-side)
        if (parsed.attempt?.examId === examId) return parsed;
      }
      const res = await api.post(`/exams/${examId}/start`);
      const data = res.data;
      // Restore previously auto-saved answers from server
      if (data.savedAnswers && Object.keys(data.savedAnswers).length > 0) {
        setAnswers(data.savedAnswers);
        toast('Restored your previous answers', { icon: '💾' });
      }
      localStorage.setItem('currentAttempt', JSON.stringify(data));
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // ── Fix 7: Compute remaining time from startedAt instead of resetting ────
  useEffect(() => {
    if (!session) return;
    const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const durationMs = (session.examDuration || 0) * 60 * 1000;
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
    setTimeLeft(remaining);
  }, [session]);

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    if (timeLeft <= 0 && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      toast('Time is up! Submitting...', { icon: '⏰' });
      submitMutation.mutate();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            toast('Time is up! Submitting...', { icon: '⏰' });
            submitMutation.mutate();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft]);

  // ── Auto-save (Fix 6): sends answers + question order every 10s ──────────
  const autoSave = useCallback(async () => {
    if (!session?.attempt?.id || !Object.keys(answers).length) return;
    const questionOrder = (session.questions || []).map((q: any) => q.id);
    try {
      await api.patch(`/attempts/${session.attempt.id}/auto-save`, { answers, questionOrder });
    } catch {
      // Silent
    }
  }, [answers, session]);

  useEffect(() => {
    const interval = setInterval(autoSave, 10000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/attempts/${session?.attempt.id}/submit`, { answers });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Exam submitted successfully!');
      localStorage.removeItem('currentAttempt');
      if (timerRef.current) clearInterval(timerRef.current);
      navigate(`/result/${session?.attempt.id}`, { replace: true });
    },
    onError: (err: any) => {
      const code = err.response?.data?.code;
      if (code === 'SEB_REQUIRED' || code === 'SEB_HASH_MISSING' || code === 'SEB_HASH_MISMATCH') {
        toast.error('This exam must be submitted from Safe Exam Browser. Your answers are auto-saved — reopen the exam in SEB to submit.', { duration: 7000 });
        return;
      }
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
    }
  });

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // ── Timer display ─────────────────────────────────────────────────────────
  const formatTime = (secs: number | null) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerColor = timeLeft !== null && timeLeft < 300
    ? 'text-red-600 animate-pulse'
    : 'text-gray-800 dark:text-gray-100';

  // ── Answered count ────────────────────────────────────────────────────────
  const answeredCount = Object.values(answers).filter(v => v !== null && v !== '').length;

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading exam...</p>
      </div>
    </div>
  );

  if (error) {
    // SEB-specific codes get the dedicated friendly screen instead of a dead-end message
    const sebCode = (error as any)?.response?.data?.code;
    if (sebCode === 'SEB_REQUIRED' || sebCode === 'SEB_HASH_MISSING' || sebCode === 'SEB_HASH_MISMATCH') {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2">
            <SebRequiredNotice onBack={() => navigate('/dashboard')} />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {(error as any)?.response?.data?.error || 'Error loading exam.'}
          </p>
          <button onClick={() => navigate('/dashboard')}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = session?.questions || [];
  const q = questions[currentIndex];
  if (!q) return <div className="p-8 text-gray-800 dark:text-gray-100">No questions found.</div>;

  const unanswered = questions.length - answeredCount;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">

      {/* ── Main question area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">CBT Examination</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length} &nbsp;·&nbsp;
              <span className="text-green-600 dark:text-green-400 font-bold">{answeredCount} answered</span>
              {unanswered > 0 && <span className="text-orange-600 dark:text-orange-400 font-bold"> · {unanswered} remaining</span>}
            </p>
          </div>
          <div className={`font-mono text-2xl font-bold ${timerColor}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        {/* Question body */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">

            {/* Question header */}
            <div className="flex items-start gap-3 mb-6">
              <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shrink-0">
                Q{currentIndex + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{q.type?.replace('_', ' ')}</span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{q.points} {q.points === 1 ? 'mark' : 'marks'}</span>
                </div>
                <div className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
                  <MathRenderer content={q.text} />
                </div>
              </div>
            </div>

            {/* Answer options */}
            <div className="space-y-3">
              {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && q.options?.map((opt: any, i: number) => {
                const isSelected = answers[q.id] === opt.id;
                const labels = ['A', 'B', 'C', 'D', 'E'];
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                      ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                  >
                    <input type="radio" name={q.id} value={opt.id}
                      onChange={() => handleAnswer(q.id, opt.id)}
                      checked={isSelected} className="hidden" />
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                      ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {labels[i] || i + 1}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{opt.text}</span>
                  </label>
                );
              })}

              {q.type === 'FILL_BLANK' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Type your answer below:</label>
                  <input
                    type="text"
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100 font-medium"
                    placeholder="Your answer here..."
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    value={answers[q.id] || ''}
                  />
                </div>
              )}

              {q.type === 'THEORY' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Write your answer below:</label>
                  <textarea
                    rows={8}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100 font-medium resize-y"
                    placeholder="Write your answer here..."
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    value={answers[q.id] || ''}
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">Theory answers are manually graded by the examiner.</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-sm disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/20"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-green-500/20"
                >
                  Finish Exam ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Question navigator sidebar ── */}
      <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-auto flex flex-col">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-xs uppercase tracking-widest">Navigator</h3>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {questions.map((_: any, idx: number) => {
            const qId = questions[idx]?.id;
            const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
            const isCurrent = idx === currentIndex;
            return (
              <button key={idx} onClick={() => setCurrentIndex(idx)}
                className={`h-10 rounded-lg text-xs font-bold transition-all
                  ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 scale-110 z-10'
                    : isAnswered ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {idx + 1}
              </button>
            );
          })}
        </div>
        
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4 mb-6">
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span className="w-3 h-3 rounded bg-green-500"></span> Answered
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span className="w-3 h-3 rounded bg-blue-600"></span> Current
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700"></span> Not answered
          </div>
        </div>

        <button
          onClick={() => setShowSubmitConfirm(true)}
          className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white text-sm py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
        >
          Submit Exam
        </button>
      </div>

      {/* ── Submit confirmation modal ── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Submit Exam?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You have answered <strong>{answeredCount}</strong> out of {questions.length} questions.
              {unanswered > 0 && <span className="block mt-1 text-red-600 dark:text-red-400 font-medium">Warning: You have {unanswered} unanswered questions!</span>}
              Once submitted, you cannot change your answers.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Go Back
              </button>
              <button
                onClick={() => { setShowSubmitConfirm(false); submitMutation.mutate(); }}
                disabled={submitMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                {submitMutation.isPending ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
