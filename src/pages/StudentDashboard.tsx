import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ThemeToggle';

export default function StudentDashboard() {
  const user    = useAuthStore(state => state.user);
  const logout  = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Student Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex gap-3 items-center">
          <ThemeToggle />
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <Link to="/exams"
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:scale-[1.02] transition-all group border-b-4 border-b-blue-500">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📝</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Available Exams</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">View and start your scheduled examinations. Ensure you have your credentials ready.</p>
          </Link>
          
          <Link to="/my-results"
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:scale-[1.02] transition-all group border-b-4 border-b-purple-500">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📊</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Results</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Check your previous exam performance, scores, and detailed reviews.</p>
          </Link>
        </div>
        
        <div className="mt-12 bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">Need Help?</h3>
            <p className="text-indigo-100 text-sm max-w-md">If you encounter any technical issues during your examination, please contact the IT support desk or your invigilator immediately.</p>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
