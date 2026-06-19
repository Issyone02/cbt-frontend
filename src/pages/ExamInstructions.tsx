import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import SebRequiredNotice from '../components/SebRequiredNotice';

export default function ExamInstructions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [sebBlocked, setSebBlocked] = useState(false);
  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => api.get('/exams/available').then(res => res.data.find((e: any) => e.id === examId))
  });

  const startExam = async () => {
    try {
      const res = await api.post(`/exams/${examId}/start`);
      localStorage.setItem('currentAttempt', JSON.stringify(res.data));
      // ✅ IMPORTANT: redirect to /take, NOT /questions
      navigate(`/exam/${examId}/take`);
    } catch (err: any) {
      // SEB-specific codes get a dedicated friendly screen instead of a toast
      const code = err.response?.data?.code;
      if (code === 'SEB_REQUIRED' || code === 'SEB_HASH_MISSING' || code === 'SEB_HASH_MISMATCH') {
        setSebBlocked(true);
        return;
      }
      toast.error(err.response?.data?.error || 'Cannot start exam');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!exam) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">Exam not found</p>
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {sebBlocked ? (
          <div className="p-8">
            <SebRequiredNotice onBack={() => navigate('/dashboard')} />
          </div>
        ) : (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{exam.title}</h1>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-6 rounded-r-2xl mb-8">
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-4">Examination Instructions</h2>
            <ul className="space-y-3 text-sm text-amber-900 dark:text-amber-200 font-medium">
              <li className="flex items-center gap-2">⏱ Duration: <strong>{exam.durationMinutes} minutes</strong></li>
              <li className="flex items-center gap-2">⚠️ Negative marking: <strong>{exam.negativeMarkingPercent ? `${exam.negativeMarkingPercent}%` : 'Disabled'}</strong></li>
              <li className="flex items-center gap-2">🎯 Passing score: <strong>{exam.passingScorePercent}%</strong></li>
              <li className="flex items-center gap-2">🚫 Do not refresh the page during the exam session</li>
              <li className="flex items-center gap-2">💾 Your progress is auto-saved every 10 seconds</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/exams')} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold text-sm transition-all">
              Cancel
            </button>
            <button onClick={startExam} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
              I Agree & Start Exam
            </button>
          </div>
        </div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest font-medium">
            Please ensure you have a stable internet connection before starting
          </p>
        </div>
      </div>
    </div>
  );
}
