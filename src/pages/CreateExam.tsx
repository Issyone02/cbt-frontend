import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import QuestionForm from '../components/QuestionForm';
import { QuestionFormState, Exam } from '../types';

const BLANK_QUESTION: QuestionFormState = {
  text: '', type: 'MCQ', points: 1,
  options: [{ text: '', isCorrect: false, orderIndex: 0 }]
};

type ExamFormState = Omit<Exam, 'id' | 'questions' | '_count'>;

const DEFAULT_EXAM: ExamFormState = {
  title: '', description: '',
  startTime: '', endTime: '',
  durationMinutes: 60, passingScorePercent: 50,
  negativeMarkingPercent: 0,
  shuffleQuestions: false, shuffleOptions: false,
  isPublished: false,
};

export default function CreateExam() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ExamFormState>(DEFAULT_EXAM);
  const [questions, setQuestions] = useState<QuestionFormState[]>([]);
  const [currentQ, setCurrentQ] = useState<QuestionFormState>({ ...BLANK_QUESTION });
  const [submitting, setSubmitting] = useState(false);

  const addQuestion = () => {
    if (!currentQ.text.trim()) return toast.error('Question text is required');
    if ((currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE') && !currentQ.options.some(o => o.isCorrect))
      return toast.error('Mark at least one correct option');
    if (currentQ.type === 'MCQ' && currentQ.options.some(o => !o.text.trim()))
      return toast.error('All options must have text');
    if (currentQ.type === 'FILL_BLANK' && !currentQ.options[0]?.text)
      return toast.error('Correct answer is required for fill-in-the-blank');

    setQuestions(prev => [...prev, { ...currentQ, options: currentQ.options.map((o, i) => ({ ...o, orderIndex: i })) }]);
    setCurrentQ({ ...BLANK_QUESTION });
    toast.success(`Question ${questions.length + 1} added`);
  };

  const removeQuestion = (index: number) => setQuestions(prev => prev.filter((_, i) => i !== index));

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Exam title is required');
    if (questions.length === 0) return toast.error('Add at least one question');
    setSubmitting(true);
    try {
      const examRes = await api.post('/admin/exams', form);
      const examId: string = examRes.data.id;
      // Use import-questions endpoint for bulk insert instead of N+1 loop
      await api.post(`/admin/exams/${examId}/import-questions`, {
        rows: questions.map((q, i) => ({
          type: q.type,
          question: q.text.replace(/<[^>]*>/g, ''),   // strip HTML for import parser
          option_a: q.options[0]?.text || '',
          option_b: q.options[1]?.text || '',
          option_c: q.options[2]?.text || '',
          option_d: q.options[3]?.text || '',
          correct: q.type === 'MCQ'
            ? ['A','B','C','D'][q.options.findIndex(o => o.isCorrect)] || 'A'
            : q.type === 'TRUE_FALSE'
            ? (q.options.find(o => o.isCorrect)?.text || 'True').toUpperCase()
            : q.options[0]?.text || '',
          points: String(q.points),
        }))
      });
      toast.success(`Exam created with ${questions.length} question${questions.length !== 1 ? 's' : ''}!`);
      navigate('/admin/exams/view');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const f = (field: keyof ExamFormState, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/exams/view')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Create New Exam</h1>
      </div>

      <form onSubmit={handleCreateExam} className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* Exam details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Exam Details</h2>
          <input className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Exam Title *"
            value={form.title} onChange={e => f('title', e.target.value)} required />
          <textarea className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none" rows={2}
            placeholder="Description (optional)"
            value={form.description} onChange={e => f('description', e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Start Time *</label>
              <input type="datetime-local" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startTime} onChange={e => f('startTime', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">End Time *</label>
              <input type="datetime-local" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endTime} onChange={e => f('endTime', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Duration (minutes)</label>
              <input type="number" min={1} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.durationMinutes} onChange={e => f('durationMinutes', parseInt(e.target.value) || 60)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Passing Score (%)</label>
              <input type="number" min={0} max={100} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.passingScorePercent} onChange={e => f('passingScorePercent', parseInt(e.target.value) || 50)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Negative Marking (%)</label>
              <input type="number" min={0} max={100} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.negativeMarkingPercent} onChange={e => f('negativeMarkingPercent', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={form.shuffleQuestions} onChange={e => f('shuffleQuestions', e.target.checked)} />
              Shuffle Questions
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={form.shuffleOptions} onChange={e => f('shuffleOptions', e.target.checked)} />
              Shuffle Options
            </label>
          </div>
        </div>

        {/* Question list preview */}
        {questions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Questions Added ({questions.length})
            </h2>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">Q{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-200 truncate"
                      dangerouslySetInnerHTML={{ __html: q.text.substring(0, 120) }} />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{q.type} · {q.points} mark{q.points !== 1 ? 's' : ''}</p>
                  </div>
                  <button type="button" onClick={() => removeQuestion(i)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium shrink-0">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add question */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {questions.length === 0 ? 'Add First Question' : `Add Question ${questions.length + 1}`}
          </h2>
          <QuestionForm
            value={currentQ}
            onChange={setCurrentQ}
            onSubmit={addQuestion}
            submitLabel="Add Question to List"
          />
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20">
          {submitting ? 'Creating...' : `Create Exam with ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  );
}
