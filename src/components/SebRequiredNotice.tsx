// Shown when the backend rejects an exam start/auto-save/submit request
// because it did not come from Safe Exam Browser (SEB_REQUIRED / SEB_HASH_*).
// Used by both ExamInstructions.tsx and TakingExam.tsx so the message stays
// consistent wherever a student gets blocked.

interface Props {
  onBack: () => void;
}

export default function SebRequiredNotice({ onBack }: Props) {
  return (
    <div className="text-center py-6 px-2">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Safe Exam Browser Required
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
        This exam can only be opened using <strong>Safe Exam Browser (SEB)</strong>.
        It looks like you're using a regular browser.
      </p>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-left text-sm text-amber-800 dark:text-amber-300 mb-6 max-w-sm mx-auto">
        <p className="font-semibold mb-2">To take this exam:</p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Ask your administrator for the exam's <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">.seb</code> file</li>
          <li>Install Safe Exam Browser if you haven't already</li>
          <li>Open the <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">.seb</code> file — the exam will load automatically</li>
        </ol>
      </div>
      <button
        onClick={onBack}
        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
