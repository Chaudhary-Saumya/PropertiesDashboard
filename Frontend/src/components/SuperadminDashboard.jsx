import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, LayoutDashboard, LogOut, Plus, Search, 
  Eye, Trash2, Edit, ChevronDown, ChevronUp, UserPlus, 
  Ruler, Activity, TrendingUp, Download, Mail, ShieldAlert, Loader2
} from 'lucide-react';
import PropertyModal from './PropertyModal';
import ProfileModal from './ProfileModal';
import AddUserModal from './AddUserModal';
import ConfirmModal from './ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function SuperadminDashboard({ admin, onLogout, showToast, onProfileUpdate }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('overview'); // 'overview', 'users', 'listings'
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Loading states
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'admins', 'users'
  const [listingSearch, setListingSearch] = useState('');
  
  // Modal states
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  // Delete confirmation modals
  const [deletePropertyTarget, setDeletePropertyTarget] = useState(null); // property id
  const [deleteUserTarget, setDeleteUserTarget] = useState(null); // { id, username }
  
  // Accordion state for users table
  const [expandedUsers, setExpandedUsers] = useState({});

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const toggleUserExpanded = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const fetchProperties = async () => {
    setPropertiesLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else {
        throw new Error('Failed to fetch global listings');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading properties.', 'error');
    } finally {
      setPropertiesLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch user directory');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading users directory.', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchUsers();
  }, []);

  const handleDeleteProperty = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Listing deleted successfully.', 'success');
        setProperties(prev => prev.filter(item => item._id !== id));
        fetchUsers(); // Sync users count
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete listing');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error deleting property', 'error');
    }
  };

  // Opens the delete confirm modal for a property
  const handleDeletePropertyClick = (id) => {
    setDeletePropertyTarget(id);
  };

  const handleDeleteUser = async (userId, username) => {
    if (userId === admin.id) {
      showToast('You cannot delete your own admin account.', 'error');
      return;
    }
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast(`Account '${username}' and properties deleted successfully.`, 'success');
        setUsers(prev => prev.filter(u => u._id !== userId));
        fetchProperties(); // Sync properties list
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error deleting user account', 'error');
    }
  };

  // Opens the delete confirm modal for a user
  const handleDeleteUserClick = (userId, username) => {
    if (userId === admin.id) {
      showToast('You cannot delete your own admin account.', 'error');
      return;
    }
    setDeleteUserTarget({ id: userId, username });
  };

  const handlePropertySaved = () => {
    setIsPropertyModalOpen(false);
    setSelectedProperty(null);
    fetchProperties();
    fetchUsers();
  };

  const handleUserSaved = () => {
    setIsAddUserModalOpen(false);
    fetchUsers();
  };

  // Export Users to CSV helper
  const handleExportUsers = () => {
    const headers = ['Username', 'Email', 'Google Login', 'Role', 'Joined Date', 'Listings Count'];
    const rows = users.map(u => [
      u.username,
      u.email,
      u.googleId === 'Yes' ? 'Google' : 'Standard',
      u.role === 'superadmin' ? 'Super Admin' : 'User',
      new Date(u.createdAt).toLocaleDateString(),
      u.properties.length
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users List
  const filteredUsers = users.filter(user => {
    const query = userSearch.toLowerCase();
    const matchesSearch = 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    
    const matchesFilter =
      userFilter === 'all' ? true :
      userFilter === 'admins' ? (user.role === 'superadmin' || user.username === 'admin') :
      userFilter === 'users' ? (user.role !== 'superadmin' && user.username !== 'admin') : true;

    return matchesSearch && matchesFilter;
  });

  // Filtered Listings List
  const filteredListings = properties.filter(prop => {
    const query = listingSearch.toLowerCase();
    return (
      prop.title.toLowerCase().includes(query) ||
      prop.location.toLowerCase().includes(query) ||
      prop.ownerName.toLowerCase().includes(query) ||
      (prop.createdBy && prop.createdBy.username.toLowerCase().includes(query))
    );
  });

  // Render Stats Grid (Overview)
  const renderOverview = () => {
    const totalUsers = users.length;
    const totalProperties = properties.length;
    const totalArea = properties.reduce((acc, p) => acc + (p.sqryard || 0), 0);
    const leaseCount = properties.filter(p => p.purpose === 'lease').length;
    const sellCount = properties.filter(p => p.purpose === 'sell').length;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Banner Title */}
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Overview Dashboard</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Global metrics, server listings summary, and platform registration stats.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform Users</span>
              <span className="text-2xl font-black text-slate-800 mt-1">{totalUsers}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Listed Properties</span>
              <span className="text-2xl font-black text-slate-800 mt-1">{totalProperties}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Area Covered</span>
              <span className="text-2xl font-black text-slate-800 mt-1">{totalArea.toLocaleString('en-IN')} sqyd</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Ruler size={20} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lease / Sale Split</span>
              <span className="text-2xl font-black text-slate-800 mt-1">{leaseCount}L / {sellCount}S</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
        </div>

        {/* Details and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Listings (left 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Recent Listings</h3>
            {properties.length > 0 ? (
              <div className="space-y-4">
                {properties.slice(0, 5).map(prop => (
                  <div key={prop._id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-2xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{prop.title}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{prop.location} • By {prop.createdBy?.username || 'System'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800 block">₹{prop.price.toLocaleString('en-IN')}</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase mt-0.5 ${
                        prop.purpose === 'sell' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {prop.purpose}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">No properties found.</div>
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Server Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-450 font-bold">Total Accounts</span>
                  <span className="text-xs font-black text-slate-800">{totalUsers}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-450 font-bold">Standard Accounts</span>
                  <span className="text-xs font-black text-slate-800">
                    {users.filter(u => u.googleId === 'No').length}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-450 font-bold">Google Accounts</span>
                  <span className="text-xs font-black text-slate-800">
                    {users.filter(u => u.googleId === 'Yes').length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setActiveMenu('users')}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200/80 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Inspect Platform Users
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Platform Users
  const renderUsers = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        
        {/* Banner section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Platform Users</h2>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              Review registered dashboard accounts and view their corresponding listed properties.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportUsers}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Export accounts to CSV"
            >
              <Download size={14} /> Export
            </button>
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-150 cursor-pointer"
            >
              <Plus size={14} /> Add User
            </button>
          </div>
        </div>

        {/* Filter / Search section */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs flex items-center">
            <Search className="absolute left-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/40">
            <button
              type="button"
              onClick={() => setUserFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                userFilter === 'all' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All: {users.length}
            </button>
            <button
              type="button"
              onClick={() => setUserFilter('admins')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                userFilter === 'admins' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admins
            </button>
            <button
              type="button"
              onClick={() => setUserFilter('users')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                userFilter === 'users' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Users
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {usersLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
              <span className="font-bold text-xs uppercase tracking-wider">Loading user base...</span>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left font-sans">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Name & Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Google SSO</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4">Listings</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                  {filteredUsers.map(user => {
                    const isExpanded = expandedUsers[user._id];
                    const isSystemAdmin = user.role === 'superadmin' || user.username === 'admin';
                    
                    return (
                      <React.Fragment key={user._id}>
                        <tr className="hover:bg-slate-55/10 transition-colors">
                          {/* Name & Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">{user.username}</span>
                                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          {/* Role */}
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              isSystemAdmin 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-slate-50 text-slate-500 border border-slate-200/60'
                            }`}>
                              {isSystemAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          {/* Google SSO */}
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              user.googleId === 'Yes' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : 'bg-slate-50 text-slate-400'
                            }`}>
                              {user.googleId === 'Yes' ? 'Google' : 'Standard'}
                            </span>
                          </td>
                          {/* Joined Date */}
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          {/* Listings Count */}
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {user.properties.length}
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleUserExpanded(user._id)}
                                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Inspect listings"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUserClick(user._id, user.username)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete account"
                                disabled={user._id === admin.id}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="6" className="bg-slate-50/30 px-6 py-4 border-t border-slate-100">
                              <div className="animate-toast-slide-in space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Properties listed by {user.username}
                                </h4>
                                {user.properties.length > 0 ? (
                                  <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
                                    <table className="min-w-full divide-y divide-slate-100 text-left text-[11px] font-semibold text-slate-600">
                                      <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        <tr>
                                          <th className="px-4 py-2.5">Title</th>
                                          <th className="px-4 py-2.5">Type</th>
                                          <th className="px-4 py-2.5">Location</th>
                                          <th className="px-4 py-2.5">Purpose</th>
                                          <th className="px-4 py-2.5 text-right">Price</th>
                                          <th className="px-4 py-2.5 text-center">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {user.properties.map(p => (
                                          <tr key={p._id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-4 py-2.5 font-bold text-slate-800">{p.title}</td>
                                            <td className="px-4 py-2.5 capitalize">{p.type}</td>
                                            <td className="px-4 py-2.5 max-w-[150px] truncate">{p.location}</td>
                                            <td className="px-4 py-2.5 capitalize">{p.purpose}</td>
                                            <td className="px-4 py-2.5 text-right font-black text-slate-800">
                                              ₹{p.price.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-2.5 text-center flex items-center justify-center gap-1.5">
                                               <button
                                                 type="button"
                                                 onClick={() => navigate(`/property/${p._id}`)}
                                                 className="px-2 py-0.5 text-[9px] border border-slate-200 text-indigo-600 bg-indigo-50/20 rounded hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                                               >
                                                 View
                                               </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedProperty(p);
                                                  setIsPropertyModalOpen(true);
                                                }}
                                                className="px-2 py-0.5 text-[9px] border border-slate-200 text-slate-600 rounded hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                                              >
                                                Edit
                                              </button>
                                               <button
                                                 type="button"
                                                 onClick={() => handleDeletePropertyClick(p._id)}
                                                 className="px-2 py-0.5 text-[9px] border border-rose-200 text-rose-600 rounded hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                               >
                                                 Delete
                                               </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center text-slate-400 font-medium text-xs">
                                    No listings found for this user.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center py-20">
              <h3 className="text-slate-800 font-bold text-sm">No Accounts Found</h3>
              <p className="text-slate-400 text-xs mt-1">We couldn't find any user profiles matching your query.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Global Listings List
  const renderListings = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        
        {/* Banner Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Global Listings</h2>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              Browse, update, and manage all property listings uploaded by your dashboard users.
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setSelectedProperty(null);
              setIsPropertyModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-xl hover:shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus size={16} /> List Property
          </button>
        </div>

        {/* Filters Search section */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="relative w-full max-w-sm flex items-center">
            <Search className="absolute left-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by title, location, owner, or uploader..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              value={listingSearch}
              onChange={(e) => setListingSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {propertiesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
              <span className="font-bold text-xs uppercase tracking-wider">Loading properties base...</span>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left font-sans">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Listed By</th>
                    <th className="px-6 py-4">Purpose</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                  {filteredListings.map(prop => (
                    <tr key={prop._id} className="hover:bg-slate-55/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{prop.title}</td>
                      <td className="px-6 py-4 capitalize">{prop.type}</td>
                      <td className="px-6 py-4 max-w-[200px] truncate">{prop.location}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/60 rounded text-[10px] font-bold">
                          {prop.createdBy?.username || 'System'}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          prop.purpose === 'sell' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {prop.purpose}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800">
                        ₹{prop.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => navigate(`/property/${prop._id}`)}
                                                    className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                                    title="View Details"
                                                  >
                                                    <Eye size={14} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setSelectedProperty(prop);
                                                      setIsPropertyModalOpen(true);
                                                    }}
                                                    className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit"
                                                  >
                                                    <Edit size={14} />
                                                  </button>
                                                   <button
                                                     type="button"
                                                     onClick={() => handleDeletePropertyClick(prop._id)}
                                                     className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                                     title="Delete"
                                                   >
                                                     <Trash2 size={14} />
                                                   </button>
                                                </div>
                                              </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center py-20">
              <h3 className="text-slate-800 font-bold text-sm">No Listings Found</h3>
              <p className="text-slate-400 text-xs mt-1">No property listings matched your filters or search term.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800 relative z-20">
        
        {/* Brand Logo Header */}
        <div>
          <div className="p-6 h-16 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-700/30">
              <Building2 size={16} />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">Admin Station</span>
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block mt-0.5">Horizon Admin Panel</span>
            </div>
          </div>

          {/* MAIN MENU LINKS */}
          <nav className="p-4 space-y-1">
            <span className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 mt-4">Main Menu</span>
            
            {/* Overview link */}
            <button
              type="button"
              onClick={() => setActiveMenu('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'overview' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Overview</span>
            </button>

            {/* Users link */}
            <button
              type="button"
              onClick={() => setActiveMenu('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'users' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Users size={16} />
              <span>Users</span>
            </button>

            {/* Listings link */}
            <button
              type="button"
              onClick={() => setActiveMenu('listings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'listings' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Building2 size={16} />
              <span>Listings</span>
            </button>
          </nav>
        </div>

        {/* BOTTOM USER PROFILE CARD */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          
          {/* User Row Clickable to Edit Profile */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {admin.profileImage ? (
                <img 
                  src={admin.profileImage} 
                  alt={admin.username} 
                  className="w-8 h-8 rounded-lg object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {admin.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="font-extrabold text-white text-xs block truncate group-hover:text-indigo-400 transition-colors">{admin.username}</span>
                <span className="text-[9px] text-slate-500 font-bold block truncate mt-0.5">{admin.email || 'N/A'}</span>
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-rose-955/40 hover:text-rose-450 border border-slate-700 hover:border-rose-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-black text-slate-400 text-xs uppercase tracking-widest">Dashboard</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="font-bold text-slate-700 capitalize text-xs">{activeMenu}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm">
              Super Admin
            </span>
          </div>
        </header>

        {/* Dynamic Inner Content */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeMenu === 'overview' && renderOverview()}
          {activeMenu === 'users' && renderUsers()}
          {activeMenu === 'listings' && renderListings()}
        </main>
      </div>

      {/* Property Edit/Create Modal Overlay */}
      {isPropertyModalOpen && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => {
            setIsPropertyModalOpen(false);
            setSelectedProperty(null);
          }}
          onSaved={handlePropertySaved}
          showToast={showToast}
        />
      )}

      {/* Superadmin profile edit modal */}
      {isProfileModalOpen && (
        <ProfileModal
          admin={admin}
          onClose={() => setIsProfileModalOpen(false)}
          onSaved={(updatedAdmin) => {
            setIsProfileModalOpen(false);
            onProfileUpdate(updatedAdmin);
          }}
          showToast={showToast}
        />
      )}

      {/* Superadmin add user modal */}
      {isAddUserModalOpen && (
        <AddUserModal
          onClose={() => setIsAddUserModalOpen(false)}
          onSaved={handleUserSaved}
          showToast={showToast}
        />
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <ConfirmModal
          title="Log Out"
          message="Are you sure you want to log out of your superadmin session? You will need to log back in to access the system directory."
          confirmLabel="Log Out"
          cancelLabel="Cancel"
          onConfirm={() => {
            setIsLogoutConfirmOpen(false);
            onLogout();
          }}
          onClose={() => setIsLogoutConfirmOpen(false)}
          type="danger"
        />
      )}

      {/* Delete Property Confirmation Modal */}
      {deletePropertyTarget && (
        <ConfirmModal
          title="Delete Listing"
          message="Are you sure you want to permanently delete this property listing? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => {
            handleDeleteProperty(deletePropertyTarget);
            setDeletePropertyTarget(null);
          }}
          onClose={() => setDeletePropertyTarget(null)}
          type="danger"
        />
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserTarget && (
        <ConfirmModal
          title="Delete User Account"
          message={`Are you sure you want to permanently delete '${deleteUserTarget.username}'? This will also delete ALL of their property listings.`}
          confirmLabel="Delete Account"
          cancelLabel="Cancel"
          onConfirm={() => {
            handleDeleteUser(deleteUserTarget.id, deleteUserTarget.username);
            setDeleteUserTarget(null);
          }}
          onClose={() => setDeleteUserTarget(null)}
          type="danger"
        />
      )}
    </div>
  );
}
