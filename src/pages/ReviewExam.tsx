import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import MathRenderer from '../components/MathRenderer';

export default function ReviewExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const { data: review, isLoading, error } = useQuery({
    queryKey: ['review', attemptId],
    queryFn: () => api.get(`/results/${attemptId}/review`).then(res => res.data)
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">Failed to load review.</p>
        <button onClick={() => navigate('/my-results')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Back to My Results</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/my-results')}
          className="mb-6 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1">
          ← Back to My Results
        </button>

        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {review.examTitle} – Review
        </h1>

        {/* Score summary */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Submission Date</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {new Date(review.submittedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Final Result</p>
              <div className={`text-2xl font-black ${review.isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {review.percentage.toFixed(1)}% – {review.isPassed ? 'PASSED' : 'FAILED'}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <span>Performance</span>
              <span>{review.obtainedPoints} / {review.totalPoints} points</span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${review.isPassed ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, review.percentage)}%` }}
              />
            </div>
          </div>
        </div>

        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Detailed Question Review</h2>

        <div className="space-y-6">
          {review.questions.map((q: any, idx: number) => (
            <div key={q.id}
              className={`rounded-2xl border shadow-sm overflow-hidden transition-all
                ${q.isCorrect
                  ? 'border-green-200 dark:border-green-900/50'
                  : 'border-red-200 dark:border-red-900/50'}`}>

              {/* Question header */}
              <div className={`px-5 py-3 flex items-center justify-between
                ${q.isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full
                    ${q.isCorrect ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'}`}>
                    Q{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{q.type?.replace('_', ' ')} · {q.points} {q.points === 1 ? 'point' : 'points'}</span>
                </div>
                <span className={`text-sm font-black
                  ${q.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {q.isCorrect ? `+${q.pointsAwarded}` : `0 / ${q.points}`}
                </span>
              </div>

              {/* Question body */}
              <div className="px-6 py-5 bg-white dark:bg-gray-800">
                <div className="text-gray-900 dark:text-gray-100 font-medium mb-6 leading-relaxed text-lg">
                  <MathRenderer content={q.text} />
                </div>

                {/* MCQ / True-False options */}
                {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && q.options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    {q.options.map((opt: any, i: number) => {
                      const labels = ['A', 'B', 'C', 'D', 'E'];
                      const isStudentAnswer = q.studentAnswer === opt.id;
                      const isCorrect = opt.isCorrect;
                      
                      let rowStyle = 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300';
                      if (isCorrect) rowStyle = 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 font-bold';
                      if (isStudentAnswer && !isCorrect) rowStyle = 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 font-bold';
                      
                      return (
                        <div key={opt.id} className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-sm transition-all ${rowStyle}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0
                            ${isCorrect ? 'bg-green-500 text-white' : isStudentAnswer ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {labels[i] || i + 1}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                          <div className="shrink-0">
                            {isCorrect && <span className="text-[10px] uppercase tracking-wider font-black">✓ Correct</span>}
                            {isStudentAnswer && !isCorrect && <span className="text-[10px] uppercase tracking-wider font-black">✗ Your Answer</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill blank / Theory answers */}
                {(q.type === 'FILL_BLANK' || q.type === 'THEORY') && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-2">Your Answer</p>
                      <p className={`font-bold ${q.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {q.studentAnswer || <em className="text-gray-400 font-normal">Not answered</em>}
                      </p>
                    </div>
                    
                    {q.type === 'FILL_BLANK' && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900/30">
                        <p className="text-[10px] text-green-600 dark:text-green-500 uppercase tracking-widest font-bold mb-2">Correct Answer</p>
                        <p className="font-bold text-green-700 dark:text-green-400">{q.correctAnswer}</p>
                      </div>
                    )}
                    
                    {q.type === 'THEORY' && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">
                        <span>ℹ️</span> Theory answers are manually graded
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
