import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  examAttempts: number;
}

const ROLES = ['Student', 'Lecturer', 'SchoolAdmin'];
const EMPTY_FORM = { email: '', password: '', firstName: '', lastName: '', studentId: '', department: '', roleName: 'Student' };

export default function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Create panel
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', studentId: '', department: '', roleName: '', password: '' });
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Create user ──────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/users', createForm);
      toast.success(`${createForm.roleName} account created`);
      setCreateForm(EMPTY_FORM);
      setShowCreate(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  // ── Open edit modal ───────────────────────────────────
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({
      firstName: u.firstName,
      lastName: u.lastName,
      studentId: u.studentId || '',
      department: u.department || '',
      roleName: u.roles[0] || 'Student',
      password: ''
    });
  };

  // ── Save edits ────────────────────────────────────────
  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${editUser.id}`, editForm);
      toast.success('User updated');
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────
  const toggleActive = async (u: User) => {
    try {
      await api.put(`/admin/users/${u.id}`, { isActive: !u.isActive });
      toast.success(`${u.firstName} ${!u.isActive ? 'activated' : 'deactivated'}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  // ── Delete user ───────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter & search ───────────────────────────────────
  const filtered = users.filter(u => {
    const name = `${u.firstName} ${u.lastName} ${u.email} ${u.studentId || ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchRole = filterRole === 'All' || u.roles.includes(filterRole);
    const matchStatus = filterStatus === 'All' || (filterStatus === 'Active' ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    students: users.filter(u => u.roles.includes('Student')).length,
    staff: users.filter(u => !u.roles.includes('Student')).length,
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      Student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Lecturer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      Support: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      SuperAdmin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      SchoolAdmin: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back</button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Manage Users</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New User'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total, color: 'text-gray-800 dark:text-gray-100' },
            { label: 'Active', value: stats.active, color: 'text-green-600 dark:text-green-400' },
            { label: 'Students', value: stats.students, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Staff', value: stats.staff, color: 'text-purple-600 dark:text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Create user panel */}
        {showCreate && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Create New User</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Name *" required
                  value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} />
                <input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last Name *" required
                  value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} />
                <input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Email address *" type="email" required
                  value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
                <input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Password * (min 6 chars)" type="password" required
                  value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Role *</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.roleName}
                  onChange={e => setCreateForm({ ...createForm, roleName: e.target.value, studentId: '', department: '' })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {createForm.roleName === 'Student' && (
                <div className="grid grid-cols-2 gap-3">
                  <input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Student ID (optional)"
                    value={createForm.studentId} onChange={e => setCreateForm({ ...createForm, studentId: e.target.value })} />
                  <input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Class / Department (optional)"
                    value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })} />
                </div>
              )}

              {createForm.roleName === 'Lecturer' && (
                <input className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Faculty / Subject Area (optional)"
                  value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })} />
              )}

              <button type="submit" disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors">
                {creating ? 'Creating...' : `Create ${createForm.roleName} Account`}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center">
          <input
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, email or student ID..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="All">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} of {users.length} users</span>
        </div>

        {/* Users table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {search || filterRole !== 'All' || filterStatus !== 'All' ? 'No users match your filters.' : 'No users yet. Create one above.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Student ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Department</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Exams</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.studentId || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.department || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map(r => (
                            <span key={r} className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${roleBadge(r)}`}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.examAttempts}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(u)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Edit</button>
                          <button onClick={() => toggleActive(u)} className={`${u.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} font-medium`}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => setDeleteTarget(u)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">First Name</label>
                  <input className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Last Name</label>
                  <input className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Role</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.roleName} onChange={e => setEditForm({ ...editForm, roleName: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {editForm.roleName === 'Student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Student ID</label>
                    <input className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.studentId} onChange={e => setEditForm({ ...editForm, studentId: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Department</label>
                    <input className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">New Password (leave blank to keep current)</label>
                <input className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  type="password" placeholder="••••••••"
                  value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete User?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>? This action cannot be undone and will remove all their data.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
