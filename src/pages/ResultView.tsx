import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResultView() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('currentAttempt');
  }, []);

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['result', attemptId],
    queryFn: () => api.get(`/results/${attemptId}`).then(res => res.data),
    retry: 1
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (error) {
    toast.error('Could not load result');
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error loading result.</p>
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors py-12 px-4">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-8 text-center">
          <h1 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Examination Result</h1>
          
          <div className={`text-7xl font-black mb-2 ${result?.isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {result?.percentage?.toFixed(1)}%
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm mb-8 uppercase tracking-wider
            ${result?.isPassed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {result?.isPassed ? '✅ Passed' : '❌ Failed'}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Points Obtained</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result?.obtainedPoints}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Total Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result?.totalPoints}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={() => window.print()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">
              Download Result (PDF)
            </button>
            <button onClick={() => navigate('/dashboard')} className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3.5 rounded-2xl font-bold text-sm transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest font-medium">
            Generated on {new Date().toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    </div>
  );
}
