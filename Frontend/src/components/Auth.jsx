import React, { useState, useEffect } from 'react';
import { Lock, User, KeyRound, Building2, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Auth({ onAuthSuccess, showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showManualFields, setShowManualFields] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleLogin = async (response) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      showToast(`Welcome back, ${data.admin.username}!`, 'success');
      onAuthSuccess(data.token, data.admin);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Google sign-in failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return;
    }

    let checkInterval;
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleLogin,
          });

          const btnParent = document.getElementById("google-signin-btn");
          if (btnParent) {
            window.google.accounts.id.renderButton(btnParent, {
              theme: "outline",
              size: "large",
              width: btnParent.offsetWidth || 320,
              text: isLogin ? "signin_with" : "signup_with",
              shape: "rectangular"
            });
          }
        } catch (error) {
          console.error("Error rendering Google Sign-In button:", error);
        }
      }
    };

    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      checkInterval = setInterval(() => {
        if (window.google && window.google.accounts) {
          initializeGoogleSignIn();
          clearInterval(checkInterval);
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isLogin, showManualFields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        showToast('Please enter both email and password.', 'error');
        return;
      }
    } else {
      if (!username.trim() || !password.trim()) {
        showToast('Please enter both name and password.', 'error');
        return;
      }
      if (!email.trim()) {
        showToast('Please enter your email address.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
    }

    setIsLoading(true);
    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: isLogin
          ? JSON.stringify({ 
              email: email.trim(), 
              password: password.trim() 
            })
          : JSON.stringify({ 
              username: username.trim(), 
              password: password.trim(),
              email: email.trim()
            }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      showToast(isLogin ? `Welcome back, ${data.admin.username}!` : 'Account registered successfully!', 'success');
      onAuthSuccess(data.token, data.admin);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Server error, please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gradient-to-tr from-indigo-100/40 via-slate-50 to-blue-200/30 overflow-hidden bg-grid-pattern py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Decorative colorful blurred blobs */}
      <div className="absolute top-1/4 -left-12 w-80 h-80 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[95px] opacity-70 animate-blob"></div>
      <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[95px] opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-violet-400/15 rounded-full mix-blend-multiply filter blur-[95px] opacity-60 animate-blob animation-delay-4000"></div>

      {/* Auth Card Container */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-b-3xl shadow-xl p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl z-10 border border-indigo-50/50">
        
        {/* Top Accent Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-t-3xl" />

        {/* Dynamic Header (Clean, logo circle completely removed) */}
        <div className="flex flex-col items-center text-center mb-8 mt-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-2 leading-relaxed">
            {isLogin 
              ? 'Sign in to manage your listings and bookings' 
              : 'Join the smartest land selling platform'
            }
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Quick Sign-In/Up Google Section */}
          {!showManualFields && (
            <div className="p-5 border border-dashed border-indigo-200/70 bg-indigo-50/10 rounded-2xl animate-fade-in">
              <span className="text-[9px] font-black text-indigo-600 tracking-widest uppercase block text-center mb-4">
                {isLogin ? 'Quick Sign-In' : 'Quick Sign-Up'}
              </span>
              
              <div 
                id="google-signin-btn" 
                className="w-full min-h-[44px] flex justify-center items-center"
                key="google-auth-element"
              >
                {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                  <div className="w-full py-2.5 px-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-semibold text-center leading-normal">
                    Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in your Frontend .env file.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toggle manual fields container */}
          {!showManualFields ? (
            <div className="space-y-5 pt-2">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                  {isLogin ? 'or login manually' : 'or register manually'}
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={() => setShowManualFields(true)}
                className="w-full py-3.5 flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
              >
                <Mail size={16} className="text-white" />
                {isLogin ? 'Login with Email' : 'Sign Up with Email'}
              </button>
            </div>
          ) : (
            /* Manual credentials input forms */
            <div className="space-y-4 animate-fade-in">
              {isLogin ? (
                /* LOGIN MANUAL FIELDS */
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-email" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 text-slate-400" size={16} />
                      <input
                        id="login-email"
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white rounded-xl text-slate-800 text-xs focus:outline-none transition-all placeholder:text-slate-400"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 text-slate-400" size={16} />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white rounded-xl text-slate-800 text-xs focus:outline-none transition-all placeholder:text-slate-400"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* REGISTRATION MANUAL FIELDS */
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-username" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 text-slate-400" size={16} />
                      <input
                        id="reg-username"
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white rounded-xl text-slate-800 text-xs focus:outline-none transition-all placeholder:text-slate-400"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-email" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 text-slate-400" size={16} />
                      <input
                        id="reg-email"
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white rounded-xl text-slate-800 text-xs focus:outline-none transition-all placeholder:text-slate-400"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 text-slate-400" size={16} />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white rounded-xl text-slate-800 text-xs focus:outline-none transition-all placeholder:text-slate-400"
                        placeholder="Create password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-confirm-password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="absolute left-3.5 text-slate-400" size={16} />
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white rounded-xl text-slate-800 text-xs focus:outline-none transition-all placeholder:text-slate-400"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-4 py-3.5 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-custom"></div>
                ) : (
                  isLogin ? 'Access Dashboard' : 'Create Account'
                )}
              </button>

              {/* Back to Quick Options */}
              <button
                type="button"
                onClick={() => {
                  setShowManualFields(false);
                  setUsername('');
                  setPassword('');
                  setEmail('');
                  setConfirmPassword('');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30 rounded-xl transition-all cursor-pointer"
              >
                ← Back to Quick Options
              </button>
            </div>
          )}
        </form>

        {/* Switcher link */}
        {isLogin ? (
          <div className="mt-8 text-center text-xs font-semibold text-slate-500">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setUsername('');
                setPassword('');
                setEmail('');
                setConfirmPassword('');
                setShowManualFields(false);
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className="text-amber-600 hover:text-amber-700 transition-colors font-bold underline cursor-pointer"
            >
              Create one free
            </button>
          </div>
        ) : (
          <div className="mt-8 text-center text-xs font-semibold text-slate-500">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setUsername('');
                setPassword('');
                setEmail('');
                setConfirmPassword('');
                setShowManualFields(false);
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className="text-indigo-600 hover:text-indigo-700 transition-colors font-bold underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
