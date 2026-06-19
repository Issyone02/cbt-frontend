import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function AdminDashboard() {
  const user     = useAuthStore(state => state.user);
  const logout   = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const { data: resetRequests = [] } = useQuery({
    queryKey: ['passwordResets'],
    queryFn: () => api.get('/admin/password-resets').then(r => r.data),
    refetchInterval: 30000,
  });

  const pendingResets = (resetRequests as any[]).length;

  const cards = [
    { to: '/admin/users',           icon: '👥', label: 'Manage Users',    sub: 'Create and manage students, lecturers', color: 'blue' },
    { to: '/admin/exams/create',    icon: '📝', label: 'Create Exam',     sub: 'Build exams with questions', color: 'green' },
    { to: '/admin/exams/view',      icon: '📋', label: 'View Exams',      sub: 'Publish, edit and manage exams', color: 'purple' },
    { to: '/admin/reports',         icon: '📊', label: 'View Reports',    sub: 'Performance analytics and exports', color: 'amber' },
    { to: '/admin/attempts',        icon: '🔄', label: 'Manage Attempts', sub: 'Reset attempts to allow retakes', color: 'indigo' },
    { to: '/admin/password-resets', icon: '🔑', label: 'Password Resets', sub: 'Handle user reset requests', badge: pendingResets, color: 'rose' },
    { to: '/admin/audit-log',       icon: '📜', label: 'Audit Log',       sub: 'View all system activity', color: 'gray' },
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, string> = {
      blue: 'border-b-blue-500 hover:border-blue-300 dark:hover:border-blue-600',
      green: 'border-b-green-500 hover:border-green-300 dark:hover:border-green-600',
      purple: 'border-b-purple-500 hover:border-purple-300 dark:hover:border-purple-600',
      amber: 'border-b-amber-500 hover:border-amber-300 dark:hover:border-amber-600',
      indigo: 'border-b-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-600',
      rose: 'border-b-rose-500 hover:border-rose-300 dark:hover:border-rose-600',
      gray: 'border-b-gray-500 hover:border-gray-300 dark:hover:border-gray-600',
    };
    return map[color] || 'border-b-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Control Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={async () => { await logout(); navigate('/login'); }}
            className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {pendingResets > 0 && (
          <Link to="/admin/password-resets"
            className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-6 py-5 mb-10 hover:shadow-lg transition-all animate-pulse">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-2xl">🔑</div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-xs">Action Required</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {pendingResets} password reset request{pendingResets !== 1 ? 's' : ''} pending
              </p>
            </div>
            <span className="bg-amber-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30">{pendingResets}</span>
          </Link>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map(card => (
            <Link key={card.to} to={card.to}
              className={`relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:scale-[1.02] transition-all p-8 border-b-4 ${getColorClasses(card.color)} group`}>
              {card.badge > 0 && (
                <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 border-2 border-white dark:border-gray-800">
                  {card.badge}
                </span>
              )}
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {card.label}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {card.sub}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
