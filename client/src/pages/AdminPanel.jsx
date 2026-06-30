import { useState, useEffect } from 'react';
import api from '../api/client';
import { formatDate } from '../utils/formatters';
import { ROLES } from '../utils/constants';
import { Shield, Users, Calendar, Activity, Plus, Edit, Key, Trash2, X } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);
  const [months, setMonths] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsPagination, setLogsPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ employee_id: '', name: '', password: '', role: 'section_user', section_id: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [uData, sData, mData] = await Promise.all([
        api.get('/users'), api.get('/sections'), api.get('/months')
      ]);
      setUsers(uData.users);
      setSections(sData.sections);
      setMonths(mData.months);
      loadLogs();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadLogs(page = 1) {
    const data = await api.get(`/logs?page=${page}&limit=20`);
    setLogs(data.logs);
    setLogsPagination(data.pagination);
  }

  async function createMonth() {
    try {
      await api.post('/months');
      showToast('Next month created successfully!', 'success');
      const mData = await api.get('/months');
      setMonths(mData.months);
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function saveUser() {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userForm);
        showToast('User updated!', 'success');
      } else {
        await api.post('/users', userForm);
        showToast('User created!', 'success');
      }
      setShowUserModal(false);
      setEditingUser(null);
      const uData = await api.get('/users');
      setUsers(uData.users);
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function resetPassword(userId) {
    const newPassword = prompt('Enter new password (min 6 chars):');
    if (!newPassword || newPassword.length < 6) return;
    try {
      await api.put(`/users/${userId}/reset-password`, { new_password: newPassword });
      showToast('Password reset!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function toggleUser(userId, isActive) {
    try {
      await api.put(`/users/${userId}`, { is_active: isActive ? 0 : 1 });
      showToast(isActive ? 'User deactivated' : 'User activated', 'success');
      const uData = await api.get('/users');
      setUsers(uData.users);
    } catch (err) { showToast(err.message, 'error'); }
  }

  function openEditUser(user) {
    setEditingUser(user);
    setUserForm({ employee_id: user.employee_id, name: user.name, password: '', role: user.role, section_id: user.section_id || '' });
    setShowUserModal(true);
  }

  function showToast(message, type) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) return <div className="page-content"><div className="loading-overlay"><div className="spinner" /></div></div>;

  return (
    <div className="page-content">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}><span className="toast-message">{toast.message}</span></div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">User management, months, and activity logs</p>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={14} style={{marginRight:6}} /> Users</button>
        <button className={`tab ${activeTab === 'months' ? 'active' : ''}`} onClick={() => setActiveTab('months')}><Calendar size={14} style={{marginRight:6}} /> Months</button>
        <button className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}><Activity size={14} style={{marginRight:6}} /> Activity Logs</button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Management</h2>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setEditingUser(null);
              setUserForm({ employee_id: '', name: '', password: '', role: 'section_user', section_id: '' });
              setShowUserModal(true);
            }}>
              <Plus size={14} /> Add User
            </button>
          </div>

          <div className="glass-card-static overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Section</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-semibold text-sm">{u.employee_id}</td>
                    <td>{u.name}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role.replace('_', ' ')}</span></td>
                    <td className="text-sm text-secondary">{u.section_name || '—'}</td>
                    <td>{u.is_active ? <span className="text-success">●</span> : <span className="text-danger">●</span>}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditUser(u)} title="Edit"><Edit size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => resetPassword(u.id)} title="Reset Password"><Key size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u.id, u.is_active)} title={u.is_active ? 'Deactivate' : 'Activate'}>
                          <Trash2 size={14} style={{color: u.is_active ? '#ef4444' : '#10b981'}} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Months Tab */}
      {activeTab === 'months' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Reporting Months</h2>
            <button className="btn btn-primary btn-sm" onClick={createMonth}>
              <Plus size={14} /> Create Next Month
            </button>
          </div>
          <div className="glass-card-static overflow-auto">
            <table className="data-table">
              <thead><tr><th>#</th><th>Month</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {months.map((m, i) => (
                  <tr key={m.id}>
                    <td className="text-tertiary">{i + 1}</td>
                    <td className="font-semibold">{m.label}</td>
                    <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                    <td className="text-xs text-secondary">{formatDate(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Activity Logs</h2>
          <div className="glass-card-static overflow-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs text-secondary">{formatDate(log.timestamp)}</td>
                    <td className="text-sm">{log.user_name || '—'} <span className="text-xs text-tertiary">({log.employee_id})</span></td>
                    <td><span className="badge badge-open">{log.action}</span></td>
                    <td className="text-sm text-secondary">{log.entity}</td>
                    <td className="text-xs text-tertiary" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logsPagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({length: logsPagination.pages}, (_, i) => (
                <button key={i} className={`btn btn-sm ${logsPagination.page === i+1 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => loadLogs(i+1)}>{i+1}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Create User'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowUserModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input className="form-input" value={userForm.employee_id} onChange={e => setUserForm({...userForm, employee_id: e.target.value})} disabled={!!editingUser} />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="admin">Admin</option>
                    <option value="section_user">Section User</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                {userForm.role === 'section_user' && (
                  <div className="form-group">
                    <label className="form-label">Assigned Section</label>
                    <select className="form-select" value={userForm.section_id} onChange={e => setUserForm({...userForm, section_id: e.target.value})}>
                      <option value="">Select Section</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveUser}>{editingUser ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
