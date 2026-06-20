import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

type Screen = 'login' | 'forgot' | 'reset' | 'forceChange';

export default function Login() {
  const [screen, setScreen] = useState<Screen>('login');

  // Login state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent]     = useState(false);

  // Forced password change state (after CLI recovery)
  const [forceNewPwd, setForceNewPwd]         = useState('');
  const [forceConfirmPwd, setForceConfirmPwd] = useState('');
  const [forceLoading, setForceLoading]       = useState(false);
  const [showForcePwd, setShowForcePwd]       = useState(false);

  // Reset password state
  const [resetEmail, setResetEmail]       = useState('');
  const [resetCode, setResetCode]         = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading]   = useState(false);
  const [showNewPwd, setShowNewPwd]       = useState(false);

  const login    = useAuthStore(state => state.login);
  const navigate = useNavigate();

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      toast.success('Login successful');
      // Check if forced password change is required (after CLI admin recovery)
      if (localStorage.getItem('mustChangePassword') === 'true') {
        localStorage.removeItem('mustChangePassword');
        setScreen('forceChange');
        return;
      }
      if (user?.roles.includes('Student')) navigate('/dashboard');
      else if (user?.roles.some(r => ['SuperAdmin','SchoolAdmin'].includes(r))) navigate('/admin');
      else if (user?.roles.includes('Lecturer')) navigate('/lecturer');
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password — submit request ─────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit request. Try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Reset password — use code from admin ─────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: resetEmail,
        resetCode: resetCode.trim(),
        newPassword
      });
      toast.success('Password reset successfully! You can now log in.');
      setEmail(resetEmail);
      setScreen('login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reset failed. Check your code and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // ── Force password change (after CLI recovery) ─────────────────────────────
  const handleForceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forceNewPwd !== forceConfirmPwd) return toast.error('Passwords do not match');
    if (forceNewPwd.length < 6) return toast.error('Password must be at least 6 characters');
    setForceLoading(true);
    try {
      const currentUser = useAuthStore.getState().user;
      // The backend's self-password-change guard requires `currentPassword`
      // whenever userId === req.user.id. Here, `password` (the login form
      // state) still holds the temporary password they just authenticated
      // with — reuse it so this request isn't rejected the same way the
      // Edit User self-change flow was.
      await api.put(`/admin/users/${currentUser?.id}`, {
        password: forceNewPwd,
        currentPassword: password
      });
      toast.success('Password changed successfully. Welcome back!');
      const user = useAuthStore.getState().user;
      if (user?.roles.includes('Student')) navigate('/dashboard');
      else if (user?.roles.some(r => ['SuperAdmin','SchoolAdmin'].includes(r))) navigate('/admin');
      else if (user?.roles.includes('Lecturer')) navigate('/lecturer');
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setForceLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      }}>
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }} />
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl" />

      {/* ── LOGIN SCREEN ── */}
      {screen === 'login' && (
        <form onSubmit={handleLogin} className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold text-white">CBT System</h1>
            <p className="text-sm text-gray-300 mt-1">Grand Issyone Hotel · Victoria Island</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
              <input type="email" required autoComplete="email"
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white/10 text-white placeholder-gray-400"
                placeholder="you@school.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
              <input type="password" required autoComplete="current-password"
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white/10 text-white placeholder-gray-400"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button type="button" onClick={() => { setScreen('forgot'); setForgotSent(false); setForgotEmail(''); }}
            className="w-full mt-3 text-sm text-indigo-300 hover:text-white hover:underline transition-colors">
            Forgot your password?
          </button>
        </form>
      )}

      {/* ── FORGOT PASSWORD SCREEN ── */}
      {screen === 'forgot' && (
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <button onClick={() => setScreen('login')}
            className="text-sm text-gray-300 hover:text-white mb-6 flex items-center gap-1">
            ← Back to Login
          </button>

          {!forgotSent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔑</span>
                </div>
                <h2 className="text-xl font-bold text-white">Forgot Password</h2>
                <p className="text-sm text-gray-300 mt-1">
                  Enter your email address and your administrator will provide you with a reset code.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
                  <input type="email" required
                    className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white/10 text-white placeholder-gray-400"
                    placeholder="your.email@school.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                  {forgotLoading ? 'Submitting...' : 'Request Password Reset'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Request Submitted</h2>
              <p className="text-sm text-gray-300 mb-6">
                Your password reset request has been sent to your administrator.
                They will provide you with a <strong>6-digit reset code</strong>.
              </p>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-200 text-left mb-6">
                <p className="font-medium mb-1">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Wait for your admin to give you the reset code</li>
                  <li>Click "Enter Reset Code" below</li>
                  <li>Enter your email, the code, and a new password</li>
                </ol>
              </div>
              <button onClick={() => { setScreen('reset'); setResetEmail(forgotEmail); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                Enter Reset Code →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESET PASSWORD SCREEN ── */}
      {screen === 'reset' && (
        <form onSubmit={handleReset} className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <button type="button" onClick={() => setScreen('forgot')}
            className="text-sm text-gray-300 hover:text-white mb-6 flex items-center gap-1">
            ← Back
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-amber-100/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔓</span>
            </div>
            <h2 className="text-xl font-bold text-white">Enter Reset Code</h2>
            <p className="text-sm text-gray-300 mt-1">Enter the 6-digit code your administrator gave you.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
              <input type="email" required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white/10 text-white placeholder-gray-400"
                value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Reset Code</label>
              <input type="text" required maxLength={6} pattern="[0-9]{6}"
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-mono tracking-[0.4em] text-center text-lg bg-white/10 text-white placeholder-gray-400"
                placeholder="000000"
                value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              <p className="text-[10px] text-gray-400 mt-1 text-center uppercase tracking-wider">6 digits — provided by your administrator</p>
            </div>

            <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl px-3 py-2.5 text-[10px] text-amber-200 uppercase tracking-wider">
              <p className="font-bold mb-1">Password rules:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>At least 6 characters</li>
                <li>Cannot match old password</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
              <div className="relative">
                <input type={showNewPwd ? 'text' : 'password'} required
                  className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm pr-12 bg-white/10 text-white placeholder-gray-400"
                  placeholder="Min 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showNewPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
              <input type={showNewPwd ? 'text' : 'password'} required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white/10 text-white placeholder-gray-400"
                placeholder="Repeat password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>

            <button type="submit" disabled={resetLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
              {resetLoading ? 'Resetting...' : 'Update Password & Login'}
            </button>
          </div>
        </form>
      )}

      {/* ── FORCE CHANGE SCREEN ── */}
      {screen === 'forceChange' && (
        <form onSubmit={handleForceChange} className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-100/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🛡️</span>
            </div>
            <h2 className="text-xl font-bold text-white">Security Update</h2>
            <p className="text-sm text-gray-300 mt-1">You must set a new password before continuing.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
              <div className="relative">
                <input type={showForcePwd ? 'text' : 'password'} required
                  className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm pr-12 bg-white/10 text-white placeholder-gray-400"
                  placeholder="Min 6 characters"
                  value={forceNewPwd} onChange={e => setForceNewPwd(e.target.value)} />
                <button type="button" onClick={() => setShowForcePwd(!showForcePwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showForcePwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
              <input type={showForcePwd ? 'text' : 'password'} required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white/10 text-white placeholder-gray-400"
                placeholder="Repeat password"
                value={forceConfirmPwd} onChange={e => setForceConfirmPwd(e.target.value)} />
            </div>

            <button type="submit" disabled={forceLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
              {forceLoading ? 'Updating...' : 'Set Password & Continue'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}