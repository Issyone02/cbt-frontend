import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AvailableExams() {
  const navigate = useNavigate();

  const { data: exams = [], isLoading, error, refetch } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await api.get('/exams/available');
      return res.data;
    },
    // Refresh every 60 seconds so newly published exams appear without manual reload
    refetchInterval: 60000,
    retry: 1
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="p-8">
      <button onClick={() => navigate('/dashboard')} className="mb-4 text-blue-600 dark:text-blue-400 underline text-sm">← Back to Dashboard</button>
      <div className="text-red-600 dark:text-red-400">Error loading exams.
        <button onClick={() => refetch()} className="ml-2 text-blue-600 dark:text-blue-400 underline">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Available Examinations</h1>
        </div>
        <button onClick={() => refetch()} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">↻ Refresh</button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {exams.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No exams available right now</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
              Your administrator has not yet published any exams, or the exam window has not started.
              Please check back later or contact your exam coordinator.
            </p>
            <button onClick={() => refetch()}
              className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Check Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{exams.length} exam{exams.length !== 1 ? 's' : ''} available</p>
            {exams.map((exam: any) => {
              const endsAt = new Date(exam.endTime);
              const minutesLeft = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 60000));
              const isUrgent = minutesLeft < 60;
              return (
                <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{exam.title}</h2>
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Live</span>
                    </div>
                    {exam.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{exam.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>⏱ {exam.durationMinutes} minutes</span>
                      <span>❓ {exam._count?.questions ?? 0} questions</span>
                      <span>✅ Pass at {exam.passingScorePercent}%</span>
                      {exam.negativeMarkingPercent > 0 && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">⚠ Negative marking: -{exam.negativeMarkingPercent}%</span>
                      )}
                    </div>
                    <p className={`text-[10px] uppercase tracking-wider mt-2 font-bold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {isUrgent
                        ? `⚠ Closes in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}!`
                        : `Closes: ${endsAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}`}
                    </p>
                  </div>
                  <Link to={`/exam/${exam.id}/instructions`}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg shadow-blue-500/20">
                    Start Exam →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
