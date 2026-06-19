import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Mathematics } from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathExpression, setMathExpression] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Mathematics,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const insertMath = () => {
    if (editor && mathExpression) {
      editor.commands.insertContent(` \\(${mathExpression}\\) `);
      setMathExpression('');
      setShowMathInput(false);
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800/50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          Bold
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          Italic
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          List
        </button>
        <button type="button" onClick={addImage} 
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Image
        </button>
        <button type="button" onClick={() => setShowMathInput(!showMathInput)} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${showMathInput ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'}`}>
          Σ Math
        </button>
      </div>
      
      {showMathInput && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-2 bg-purple-50/30 dark:bg-purple-900/10">
          <input 
            type="text" 
            placeholder="LaTeX: E = mc^2" 
            className="flex-1 px-3 py-2 border border-purple-200 dark:border-purple-900/30 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-500"
            value={mathExpression}
            onChange={(e) => setMathExpression(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertMath()}
          />
          <button type="button" onClick={insertMath} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-purple-500/20">
            Insert
          </button>
        </div>
      )}
      
      <EditorContent editor={editor} 
        className="p-4 min-h-[150px] prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100 focus:outline-none" />
    </div>
  );
}
