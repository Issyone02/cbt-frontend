import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function EditExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    passingScorePercent: 50,
    negativeMarkingPercent: 0,
    shuffleQuestions: false,
    shuffleOptions: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      const res = await api.get('/admin/exams');
      const exam = res.data.find((e: any) => e.id === examId);
      if (exam) {
        setForm({
          title: exam.title,
          description: exam.description || '',
          startTime: exam.startTime.slice(0, 16),
          endTime: exam.endTime.slice(0, 16),
          durationMinutes: exam.durationMinutes,
          passingScorePercent: exam.passingScorePercent,
          negativeMarkingPercent: exam.negativeMarkingPercent || 0,
          shuffleQuestions: exam.shuffleQuestions,
          shuffleOptions: exam.shuffleOptions
        });
      }
    } catch (err) {
      toast.error('Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/exams/${examId}`, form);
      toast.success('Exam updated');
      navigate('/admin/exams/view');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
        <button onClick={() => navigate('/admin/exams/view')} className="mb-6 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1">
          ← Back to Exams
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Edit Examination</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Exam Title</label>
            <input className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" 
              placeholder="Enter title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Description</label>
            <textarea className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100 resize-none" 
              rows={3} placeholder="Enter description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
              <input type="datetime-local" className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" 
                value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">End Time</label>
              <input type="datetime-local" className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" 
                value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Duration (mins)</label>
              <input type="number" className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" 
                value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Passing Score (%)</label>
              <input type="number" className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" 
                value={form.passingScorePercent} onChange={e => setForm({...form, passingScorePercent: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={form.shuffleQuestions} onChange={e => setForm({...form, shuffleQuestions: e.target.checked})} />
              Shuffle Questions
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={form.shuffleOptions} onChange={e => setForm({...form, shuffleOptions: e.target.checked})} />
              Shuffle Options
            </label>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 mt-4">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
