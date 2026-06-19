import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/RichTextEditor';
import { useAuthStore } from '../stores/authStore';

// ── CSV template columns ────────────────────────────────────────────────────
const CSV_TEMPLATE_HEADER = 'type,question,option_a,option_b,option_c,option_d,correct,points';
const CSV_TEMPLATE_ROWS = [
  'MCQ,What is the capital of Nigeria?,Lagos,Abuja,Kano,Ibadan,B,1',
  'MCQ,Which organ pumps blood?,Brain,Liver,Heart,Kidney,C,2',
  'TRUE_FALSE,The Earth is the third planet from the Sun.,,,,,TRUE,1',
  'TRUE_FALSE,Water boils at 90°C at sea level.,,,,,FALSE,1',
  'FILL_BLANK,The chemical symbol for Gold is ____.,,,,,Au,1',
  'FILL_BLANK,_______ is the powerhouse of the cell.,,,,,Mitochondria,2',
  'THEORY,Explain the water cycle in detail.,,,,,, 3',
];
const CSV_TEMPLATE = [CSV_TEMPLATE_HEADER, ...CSV_TEMPLATE_ROWS].join('\n');

// ── CSV parser ──────────────────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, '_'));
  return lines.slice(1).map(line => {
    // Handle commas inside quotes
    const cols: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    cols.push(cur);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
    return row;
  });
}

const TYPE_LABELS: Record<string, string> = { MCQ: 'MCQ', TRUE_FALSE: 'True/False', FILL_BLANK: 'Fill Blank', THEORY: 'Theory' };

export default function ManageQuestions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  // Lecturers return to their dashboard; admins return to exam list
  const isLecturer = user?.roles?.includes('Lecturer') && !user?.roles?.some(r => ['SuperAdmin','SchoolAdmin'].includes(r));
  const backPath = isLecturer ? '/lecturer' : '/admin/exams/view';
  const backLabel = isLecturer ? '← Back to Dashboard' : '← Back to Exams';
  const fileRef = useRef<HTMLInputElement>(null);

  const [questions, setQuestions]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport]   = useState(false);

  // Import state
  const [csvRows, setCsvRows]         = useState<Record<string, string>[]>([]);
  const [csvErrors, setCsvErrors]     = useState<string[]>([]);
  const [importing, setImporting]     = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    text: '', type: 'MCQ', points: 1,
    options: [{ text: '', isCorrect: false, orderIndex: 0 }]
  });

  useEffect(() => { fetchQuestions(); }, [examId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/exams/${examId}/questions`);
      setQuestions(res.data);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoading(false); }
  };

  // ── CSV file pick ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      // Client-side pre-validation
      const errs: string[] = [];
      rows.forEach((row, i) => {
        const rowNum = i + 2;
        const type = (row.type || '').toUpperCase();
        if (!row.question) errs.push(`Row ${rowNum}: question is empty`);
        if (!['MCQ','TRUE_FALSE','FILL_BLANK','THEORY'].includes(type))
          errs.push(`Row ${rowNum}: type "${row.type}" is invalid`);
        if (type === 'MCQ' && !['A','B','C','D'].includes((row.correct||'').toUpperCase()))
          errs.push(`Row ${rowNum}: MCQ correct must be A, B, C, or D`);
        if (type === 'TRUE_FALSE' && !['TRUE','FALSE'].includes((row.correct||'').toUpperCase()))
          errs.push(`Row ${rowNum}: TRUE_FALSE correct must be TRUE or FALSE`);
        if (type === 'FILL_BLANK' && !row.correct)
          errs.push(`Row ${rowNum}: FILL_BLANK correct answer is empty`);
      });
      setCsvRows(rows);
      setCsvErrors(errs);
      setImportResult(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Download template ─────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'questions_template.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Send to backend ───────────────────────────────────────────────────────
  const handleImport = async () => {
    if (csvErrors.length > 0) return toast.error('Fix the errors in your CSV before importing');
    setImporting(true);
    try {
      const res = await api.post(`/admin/exams/${examId}/import-questions`, { rows: csvRows });
      setImportResult(res.data);
      if (res.data.imported > 0) {
        toast.success(`${res.data.imported} question${res.data.imported !== 1 ? 's' : ''} imported!`);
        fetchQuestions();
        setCsvRows([]);
      }
      if (res.data.errors?.length) toast.error(`${res.data.errors.length} row(s) had errors`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally { setImporting(false); }
  };

  // ── Delete question ───────────────────────────────────────────────────────
  const handleDelete = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${questionId}`);
      toast.success('Question deleted');
      fetchQuestions();
    } catch { toast.error('Delete failed'); }
  };

  // ── Add question ──────────────────────────────────────────────────────────
  const addNewQuestion = async () => {
    if (!newQuestion.text) return toast.error('Question text required');
    if ((newQuestion.type === 'MCQ' || newQuestion.type === 'TRUE_FALSE') &&
      !newQuestion.options.some(o => o.isCorrect)) return toast.error('Mark at least one correct option');
    if (newQuestion.type === 'FILL_BLANK' && !newQuestion.options[0]?.text) return toast.error('Correct answer required');
    try {
      const optionsToSend = newQuestion.type === 'FILL_BLANK'
        ? [{ text: newQuestion.options[0].text, isCorrect: true, orderIndex: 0 }]
        : newQuestion.options.map((o, i) => ({ ...o, orderIndex: i }));
      await api.post(`/admin/exams/${examId}/questions`, {
        text: newQuestion.text, type: newQuestion.type,
        points: newQuestion.points, orderIndex: questions.length, options: optionsToSend
      });
      toast.success('Question added');
      setShowAddForm(false);
      setNewQuestion({ text: '', type: 'MCQ', points: 1, options: [{ text: '', isCorrect: false, orderIndex: 0 }] });
      fetchQuestions();
    } catch { toast.error('Failed to add question'); }
  };

  // ── Update question ───────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editing.text) return toast.error('Question text required');
    if ((editing.type === 'MCQ' || editing.type === 'TRUE_FALSE') &&
      !editing.options.some((o: any) => o.isCorrect)) return toast.error('At least one correct option required');
    try {
      await api.put(`/admin/questions/${editing.id}`, {
        text: editing.text, type: editing.type, points: editing.points,
        orderIndex: editing.orderIndex,
        options: editing.options.map((o: any, i: number) => ({ text: o.text, isCorrect: o.isCorrect, orderIndex: i }))
      });
      toast.success('Question updated');
      setEditing(null);
      fetchQuestions();
    } catch { toast.error('Update failed'); }
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(backPath)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">{backLabel}</button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Manage Questions</h1>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">{questions.length} total</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(!showImport); setShowAddForm(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showImport ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20'}`}>
            {showImport ? 'Cancel Import' : '⬆ Import CSV'}
          </button>
          <button onClick={() => { setShowAddForm(!showAddForm); setShowImport(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showAddForm ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20'}`}>
            {showAddForm ? 'Cancel' : '+ Add Question'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* ── CSV Import Panel ── */}
        {showImport && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/20 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-purple-800 dark:text-purple-400">Import Questions from CSV</h2>
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-0.5">Upload a .csv file to add multiple questions at once</p>
              </div>
              <button onClick={downloadTemplate}
                className="text-xs bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5">
                ⬇ Download Template
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 text-[10px] font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                <p className="text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest font-bold"># CSV column format:</p>
                <p>type, question, option_a, option_b, option_c, option_d, correct, points</p>
                <p className="text-gray-400 dark:text-gray-500 mt-3 mb-1 uppercase tracking-widest font-bold"># Examples:</p>
                <p>MCQ, What is 2+2?, 3, 4, 5, 6, B, 1</p>
                <p>TRUE_FALSE, The sun rises in the east., , , , , TRUE, 1</p>
                <p>FILL_BLANK, The capital of Nigeria is ____., , , , , Abuja, 1</p>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-900/50 rounded-xl p-8 text-center cursor-pointer transition-colors group">
                <div className="text-3xl mb-2">📂</div>
                <p className="text-gray-600 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 font-medium">Click to choose a CSV file</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Only .csv files are supported</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </div>

              {csvRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{csvRows.length} row{csvRows.length !== 1 ? 's' : ''} detected</p>
                    {csvErrors.length === 0
                      ? <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ All rows valid</span>
                      : <span className="text-xs text-red-600 dark:text-red-400 font-medium">⚠ {csvErrors.length} error{csvErrors.length !== 1 ? 's' : ''}</span>}
                  </div>

                  {csvErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-3 mb-3 space-y-1">
                      {csvErrors.map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">• {e}</p>)}
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <tr>
                          {['#', 'Type', 'Question', 'Options', 'Correct', 'Points'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {csvRows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="text-gray-600 dark:text-gray-400">
                            <td className="px-3 py-2">{i + 1}</td>
                            <td className="px-3 py-2 font-bold">{row.type}</td>
                            <td className="px-3 py-2 truncate max-w-xs">{row.question}</td>
                            <td className="px-3 py-2">{row.type === 'MCQ' ? '4' : '—'}</td>
                            <td className="px-3 py-2 text-blue-600 dark:text-blue-400 font-bold">{row.correct}</td>
                            <td className="px-3 py-2">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvRows.length > 5 && <p className="p-2 text-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 italic">... and {csvRows.length - 5} more rows</p>}
                  </div>

                  <button
                    onClick={handleImport}
                    disabled={importing || csvErrors.length > 0}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50">
                    {importing ? 'Importing...' : `Import ${csvRows.length} Questions`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Add/Edit Question Form ── */}
        {(showAddForm || editing) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {editing ? 'Edit Question' : 'Add New Question'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Type</label>
                <select className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editing ? editing.type : newQuestion.type}
                  onChange={e => editing ? setEditing({...editing, type: e.target.value}) : setNewQuestion({...newQuestion, type: e.target.value})}>
                  {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Points</label>
                <input type="number" min={1} className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editing ? editing.points : newQuestion.points}
                  onChange={e => editing ? setEditing({...editing, points: parseInt(e.target.value)}) : setNewQuestion({...newQuestion, points: parseInt(e.target.value)})}/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Question Text</label>
              <RichTextEditor
                value={editing ? editing.text : newQuestion.text}
                onChange={val => editing ? setEditing({...editing, text: val}) : setNewQuestion({...newQuestion, text: val})}
              />
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Options & Correct Answer</label>
              {(editing || newQuestion).options.map((opt: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const opts = [...(editing || newQuestion).options];
                      opts.forEach((o, idx) => o.isCorrect = (idx === i));
                      editing ? setEditing({...editing, options: opts}) : setNewQuestion({...newQuestion, options: opts});
                    }}
                    className={`w-10 h-10 rounded-xl font-bold text-sm shrink-0 transition-colors border-2
                      ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                    {optionLabels[i]}
                  </button>
                  <input
                    className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={`Option ${optionLabels[i]} text...`}
                    value={opt.text}
                    onChange={e => {
                      const opts = [...(editing || newQuestion).options];
                      opts[i].text = e.target.value;
                      editing ? setEditing({...editing, options: opts}) : setNewQuestion({...newQuestion, options: opts});
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => editing ? setEditing(null) : setShowAddForm(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={editing ? handleUpdate : addNewQuestion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                {editing ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </div>
        )}

        {/* ── Question List ── */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center shadow-sm">
              <div className="text-4xl mb-3">❓</div>
              <p className="text-gray-500 dark:text-gray-400">No questions yet. Click "+ Add Question" or "Import CSV" to begin.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Q{idx + 1}</span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{TYPE_LABELS[q.type]}</span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">· {q.points} point{q.points !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(q)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">✏️</button>
                      <button onClick={() => handleDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">🗑️</button>
                    </div>
                  </div>
                  <div className="text-gray-800 dark:text-gray-100 text-sm font-medium mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options?.map((opt: any, i: number) => (
                      <div key={opt.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${opt.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${opt.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                          {optionLabels[i]}
                        </span>
                        <span className="truncate">{opt.text}</span>
                        {opt.isCorrect && <span className="ml-auto">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
