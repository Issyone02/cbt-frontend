import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Mathematics } from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Maximum size of the ORIGINAL file the user selects, before any resizing.
// Large phone photos can be 10-20MB — reject early rather than freeze the
// browser trying to process something huge.
const MAX_ORIGINAL_FILE_MB = 10;

// Resizes and compresses an image client-side before it's embedded, so a
// 5MB phone photo becomes a lightweight ~100-300KB image instead. This is
// what makes embedding images directly into question text practical —
// no separate file storage or upload server needed at all.
function resizeAndCompressImage(file: File, maxWidth = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Use the global DOM Image constructor explicitly — the Tiptap
      // extension imported above is also named `Image`, so plain `new Image()`
      // would collide with that import.
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported in this browser')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not read image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathExpression, setMathExpression] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Clicking "Image" now opens a real file picker instead of a URL prompt
  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file || !editor) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG, JPG, etc.)');
      return;
    }
    if (file.size > MAX_ORIGINAL_FILE_MB * 1024 * 1024) {
      toast.error(`Image is too large. Please choose a file under ${MAX_ORIGINAL_FILE_MB}MB.`);
      return;
    }

    setUploadingImage(true);
    try {
      const dataUrl = await resizeAndCompressImage(file);
      editor.chain().focus().setImage({ src: dataUrl }).run();
      toast.success('Image added — it will be saved with the question');
    } catch (err) {
      toast.error('Could not process that image. Please try a different file.');
    } finally {
      setUploadingImage(false);
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
        <button type="button" onClick={addImage} disabled={uploadingImage}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
          {uploadingImage ? (
            <>
              <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
              Processing...
            </>
          ) : (
            <>📷 Image / Diagram</>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />
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
        className="p-4 min-h-[150px] prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100 focus:outline-none [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2" />
    </div>
  );
}