import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SuperadminDashboard from './components/SuperadminDashboard';
import PropertyDetailsPage from './components/PropertyDetailsPage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('admin');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });
  const [isValidating, setIsValidating] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast System
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  // Check token validity on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;

      setIsValidating(true);
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const adminData = await response.json();
          setAdmin(adminData);
          setToken(storedToken);
        } else {
          // Token is invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        showToast('Could not verify session with backend.', 'error');
      } finally {
        setIsValidating(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (newToken, newAdmin) => {
    setToken(newToken);
    setAdmin(newAdmin);
  };

  const handleProfileUpdate = (updatedAdmin) => {
    setAdmin(updatedAdmin);
    localStorage.setItem('admin', JSON.stringify(updatedAdmin));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setToken('');
    setAdmin(null);
    showToast('Logged out successfully.', 'info');
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin-custom"></div>
        <span className="font-medium tracking-wide">Verifying admin session...</span>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route 
          path="/login" 
          element={
            token && admin ? (
              <Navigate to={admin.username === 'admin' ? "/superadmin" : "/dashboard"} replace />
            ) : (
              <Auth onAuthSuccess={handleAuthSuccess} showToast={showToast} />
            )
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            token && admin ? (
              admin.username === 'admin' ? (
                <Navigate to="/superadmin" replace />
              ) : (
                <Dashboard 
                  admin={admin} 
                  onLogout={handleLogout} 
                  showToast={showToast} 
                  onProfileUpdate={handleProfileUpdate}
                />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/superadmin" 
          element={
            token && admin ? (
              admin.username !== 'admin' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <SuperadminDashboard
                  admin={admin}
                  onLogout={handleLogout}
                  showToast={showToast}
                  onProfileUpdate={handleProfileUpdate}
                />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/property/:id" 
          element={
            token && admin ? (
              <PropertyDetailsPage 
                admin={admin}
                showToast={showToast}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="*" 
          element={
            token && admin ? (
              <Navigate to={admin.username === 'admin' ? "/superadmin" : "/dashboard"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>

      {/* Global Toast Portal */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 md:top-6 flex flex-col gap-2.5 z-[2000] max-w-[90%] sm:max-w-sm w-full px-4 sm:px-0">
          {toasts.map((toast) => (
            <div 
              key={toast.id} 
              className={`animate-toast-slide-down flex items-center justify-between gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl border-l-4 bg-white text-slate-800 text-xs sm:text-sm font-semibold border border-slate-100/80 ${
                toast.type === 'success' ? 'border-l-emerald-500' :
                toast.type === 'error' ? 'border-l-rose-500' : 'border-l-indigo-500'
              }`}
            >
              <span className="leading-snug">{toast.message}</span>
              <button 
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors ml-1.5 p-1 hover:bg-slate-50 rounded-lg shrink-0"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
