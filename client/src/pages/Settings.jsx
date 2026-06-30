import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Settings as SettingsIcon, User, Key, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState(null);

  function showToast(message, type) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await api.put('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="page-content">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}><span className="toast-message">{toast.message}</span></div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Account preferences and profile</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card-static p-6 mb-6 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-6">
          <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg, var(--accent-cyan), var(--accent-cyan-dark))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'var(--font-2xl)',fontWeight:800,color:'#000'}}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-secondary text-sm">{user?.employee_id}</p>
            <span className={`badge badge-${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-2 gap-4" style={{maxWidth:500}}>
          <div>
            <span className="text-xs text-tertiary">Employee ID</span>
            <p className="font-semibold">{user?.employee_id}</p>
          </div>
          <div>
            <span className="text-xs text-tertiary">Role</span>
            <p className="font-semibold" style={{textTransform:'capitalize'}}>{user?.role?.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-xs text-tertiary">Section</span>
            <p className="font-semibold">{user?.section_name || 'All Sections'}</p>
          </div>
          <div>
            <span className="text-xs text-tertiary">Section Code</span>
            <p className="font-semibold">{user?.section_code || '—'}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="glass-card-static p-6 animate-fade-in-up" style={{animationDelay:'0.1s', maxWidth:500}}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Key size={18} /> Change Password</h3>
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" style={{alignSelf:'flex-start'}}>
            <Key size={14} /> Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
