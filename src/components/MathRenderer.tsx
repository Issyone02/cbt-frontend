import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
}

export default function MathRenderer({ content }: MathRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: content }} />
  );
}
