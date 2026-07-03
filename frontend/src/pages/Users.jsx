import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, UserX, X } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', roleId: '', branchId: '', firstName: '', lastName: '', phone: '' });

  useEffect(() => { fetchUsers(); fetchRoles(); fetchBranches(); }, []);

  const fetchUsers = async () => { const { data } = await api.get('/users'); setUsers(data.data); };
  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/users');
      const roleMap = {};
      data.data.forEach((u) => { if (u.Role && !roleMap[u.Role.id]) roleMap[u.Role.id] = u.Role; });
      setRoles(Object.values(roleMap));
    } catch { setRoles([]); }
  };
  const fetchBranches = async () => { const { data } = await api.get('/branches'); setBranches(data.data); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setShowModal(false);
      setEditing(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email, password: '', roleId: u.roleId, branchId: u.branchId || '', firstName: u.firstName || '', lastName: u.lastName || '', phone: u.phone || '' });
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => { setEditing(null); setForm({ username: '', email: '', password: '', roleId: '', branchId: '', firstName: '', lastName: '', phone: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Username</th>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Branch</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{u.username}</td>
                <td className="table-cell">{u.firstName} {u.lastName}</td>
                <td className="table-cell">{u.email}</td>
                <td className="table-cell">
                  <span className="badge bg-primary-100 text-primary-700 capitalize">{u.Role?.name?.replace('_', ' ')}</span>
                </td>
                <td className="table-cell">{u.Branch?.name || '-'}</td>
                <td className="table-cell">
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(u)} className="text-primary-600 hover:text-primary-800"><Edit className="w-4 h-4" /></button>
                    {u.isActive && <button onClick={() => handleDeactivate(u.id)} className="text-red-500 hover:text-red-700"><UserX className="w-4 h-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="input" placeholder="Username *" required disabled={!!editing} />
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input" placeholder="Email *" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="input" placeholder="First Name" />
                <input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="input" placeholder="Last Name" />
              </div>
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input" placeholder="Phone" />
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input" placeholder={editing ? 'New password (leave blank to keep)' : 'Password *'} required={!editing} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.roleId} onChange={(e) => setForm({...form, roleId: e.target.value})} className="input" required>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>)}
                </select>
                <select value={form.branchId} onChange={(e) => setForm({...form, branchId: e.target.value})} className="input">
                  <option value="">No branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
