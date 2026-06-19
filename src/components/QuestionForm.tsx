// ─────────────────────────────────────────────────────────────────────────────
// QuestionForm — shared component used in both CreateExam and ManageQuestions.
// Previously the option-builder UI was copy-pasted in both files.
// Now any bug fix or UI change only needs to happen here.
// ─────────────────────────────────────────────────────────────────────────────
import RichTextEditor from './RichTextEditor';
import { QuestionFormState, OptionFormState } from '../types';

interface Props {
  value: QuestionFormState;
  onChange: (q: QuestionFormState) => void;
  onSubmit: () => void;
  submitLabel?: string;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const BLANK_OPTION: OptionFormState = { text: '', isCorrect: false, orderIndex: 0 };

export default function QuestionForm({ value, onChange, onSubmit, submitLabel = 'Save Question' }: Props) {

  const setType = (type: QuestionFormState['type']) => {
    let options: OptionFormState[];
    if (type === 'TRUE_FALSE') {
      options = [
        { text: 'True',  isCorrect: false, orderIndex: 0 },
        { text: 'False', isCorrect: false, orderIndex: 1 },
      ];
    } else if (type === 'FILL_BLANK') {
      options = [{ text: '', isCorrect: true, orderIndex: 0 }];
    } else {
      options = [{ ...BLANK_OPTION }];
    }
    onChange({ ...value, type, options });
  };

  const setOption = (index: number, patch: Partial<OptionFormState>) => {
    const options = value.options.map((o, i) => i === index ? { ...o, ...patch } : o);
    onChange({ ...value, options });
  };

  const addOption = () =>
    onChange({ ...value, options: [...value.options, { text: '', isCorrect: false, orderIndex: value.options.length }] });

  const removeOption = (index: number) =>
    onChange({ ...value, options: value.options.filter((_, i) => i !== index) });

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Question Text</label>
        <RichTextEditor
          value={value.text}
          onChange={(html) => onChange({ ...value, text: html })}
          placeholder="Question text..."
        />
      </div>

      {/* Type + Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Question Type</label>
          <select
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            value={value.type}
            onChange={e => setType(e.target.value as QuestionFormState['type'])}
          >
            <option value="MCQ">MCQ (Multiple Choice)</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_BLANK">Fill in the Blank</option>
            <option value="THEORY">Theory (Manual grading)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Points</label>
          <input
            type="number" min={1}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            value={value.points}
            onChange={e => onChange({ ...value, points: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      {/* MCQ options */}
      {value.type === 'MCQ' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Answer Options — check the correct one(s)</label>
          {value.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-black text-gray-500 dark:text-gray-400 shrink-0">{OPTION_LABELS[i]}</span>
              <input
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={`Option ${OPTION_LABELS[i]}`}
                value={opt.text}
                onChange={e => setOption(i, { text: e.target.value })}
              />
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer whitespace-nowrap shrink-0">
                <input
                  type="checkbox" checked={opt.isCorrect}
                  onChange={e => setOption(i, { isCorrect: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Correct
              </label>
              {value.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >×</button>
              )}
            </div>
          ))}
          {value.options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest"
            >+ Add option</button>
          )}
        </div>
      )}

      {/* True/False radio */}
      {value.type === 'TRUE_FALSE' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Select the correct answer</label>
          <div className="grid grid-cols-2 gap-4">
            {value.options.map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all
                ${opt.isCorrect 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                  : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                <input
                  type="radio"
                  name="tf_correct"
                  checked={opt.isCorrect}
                  onChange={() => onChange({
                    ...value,
                    options: value.options.map((o, j) => ({ ...o, isCorrect: j === i }))
                  })}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-bold uppercase tracking-wider">{opt.text}</span>
                {opt.isCorrect && <span className="ml-auto text-[10px] font-black uppercase">✓ Correct</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Fill in the blank */}
      {value.type === 'FILL_BLANK' && (
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Correct Answer (exact match, case-insensitive)</label>
          <input
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Mitochondria"
            value={value.options[0]?.text || ''}
            onChange={e => onChange({ ...value, options: [{ text: e.target.value, isCorrect: true, orderIndex: 0 }] })}
          />
        </div>
      )}

      {/* Theory info */}
      {value.type === 'THEORY' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl px-5 py-4 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <p className="font-medium">Theory questions require manual grading by the examiner. No options needed.</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
      >
        {submitLabel}
      </button>
    </div>
  );
}
