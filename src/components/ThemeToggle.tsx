import { useThemeStore } from '../stores/themeStore';

type Theme = 'light' | 'dark' | 'system';

const OPTIONS: { key: Theme; label: string; icon: string }[] = [
  { key: 'light',  label: 'Light',  icon: '☀️' },
  { key: 'dark',   label: 'Dark',   icon: '🌙' },
  { key: 'system', label: 'System', icon: '💻' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => setTheme(opt.key)}
          title={opt.label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${theme === opt.key
              ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
          <span>{opt.icon}</span>
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}