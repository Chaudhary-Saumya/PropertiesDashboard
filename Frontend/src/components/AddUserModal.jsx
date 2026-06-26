import React, { useState } from 'react';
import { X, Loader2, UserPlus, Lock, User, Mail } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AddUserModal({ onClose, onSaved, showToast }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    if (username.trim().length < 3) {
      showToast('Username must be at least 3 characters.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      // Call public register endpoint
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          ...(email.trim() ? { email: email.trim() } : {})
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      showToast(`User account '${username.trim()}' created successfully!`, 'success');
      onSaved(); // Trigger refresh on users list
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error creating user account.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100 animate-toast-slide-in">
        
        {/* Top Gradient Header */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Create User Account</h3>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">
                Register a new portal account for listing properties.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-username" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Username
            </label>
            <div className="relative flex items-center group">
              <User className="absolute left-3.5 text-slate-400" size={16} />
              <input
                id="add-username"
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
          </div>

          {/* Email (optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-email" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Email Address <span className="normal-case text-slate-400 font-normal">(optional — needed for email login)</span>
            </label>
            <div className="relative flex items-center group">
              <Mail className="absolute left-3.5 text-slate-400" size={16} />
              <input
                id="add-email"
                type="email"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative flex items-center group">
              <Lock className="absolute left-3.5 text-slate-400" size={16} />
              <input
                id="add-password"
                type="password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-confirm-password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Confirm Password
            </label>
            <div className="relative flex items-center group">
              <Lock className="absolute left-3.5 text-slate-400" size={16} />
              <input
                id="add-confirm-password"
                type="password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin text-white" size={16} /> : 'Create User'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
