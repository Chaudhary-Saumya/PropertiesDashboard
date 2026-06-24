import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function ProfileModal({ admin, onClose, onSaved, showToast }) {
  const [username, setUsername] = useState(admin.username || '');
  const [profileImage, setProfileImage] = useState(admin.profileImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (limit to 4MB for profile pictures)
    if (file.size > 4 * 1024 * 1024) {
      showToast('Image size must be less than 4MB.', 'error');
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('images', file); // Backend expects array under 'images' field

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Image upload failed');
      }

      const data = await response.json();
      if (data.urls && data.urls.length > 0) {
        setProfileImage(data.urls[0]);
        showToast('Profile image uploaded successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error uploading profile image.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Username cannot be empty.', 'error');
      return;
    }

    if (username.trim().length < 3) {
      showToast('Username must be at least 3 characters long.', 'error');
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          profileImage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      showToast('Profile updated successfully.', 'success');
      onSaved(data); // Propagate updated admin object up
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error saving profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100 animate-toast-slide-in">
        
        {/* Top Gradient Header */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />

        {/* Modal Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Edit Profile</h3>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              Customize your profile details and uploading a custom avatar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Upload Selection Section */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-100 bg-slate-50 flex items-center justify-center shadow-md relative">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <User size={40} />
                    </div>
                  )}

                  {/* Loading spinner overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="animate-spin text-indigo-600" size={24} />
                    </div>
                  )}
                </div>

                {/* Upload action overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 flex items-center justify-center cursor-pointer"
                  disabled={isUploading}
                  title="Upload profile picture"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <span className="text-[10px] text-slate-450 font-bold tracking-wide uppercase mt-2">
                Click camera to upload avatar
              </span>
            </div>

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-username" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Display Username
              </label>
              <input
                id="modal-username"
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSaving || isUploading}
                required
              />
            </div>

            {/* Email Field (Disabled, view-only metadata) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-400 text-sm cursor-not-allowed select-none"
                value={admin.email || 'N/A'}
                disabled
              />
            </div>

            {/* Actions footer */}
            <div className="flex items-center gap-3 pt-2">
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
                disabled={isSaving || isUploading}
              >
                {isSaving ? <Loader2 className="animate-spin text-white" size={16} /> : 'Save Profile'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
