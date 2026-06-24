import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, LogOut, Plus, Search, 
  Home, IndianRupee, LayoutGrid, Ruler,
  TrendingUp, Activity, Inbox, Users,
  ChevronDown, ChevronUp, List, History, Settings,
  X, SlidersHorizontal
} from 'lucide-react';
import PropertyCard from './PropertyCard';
import PropertyModal from './PropertyModal';
import ProfileModal from './ProfileModal';
import CustomSelect from './CustomSelect';
import ConfirmModal from './ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Dashboard({ admin, onLogout, showToast, onProfileUpdate }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabQuery = searchParams.get('tab') || 'overview';

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('overview');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Sync mobileTab state with query parameter ?tab=
  useEffect(() => {
    if (activeTabQuery) {
      setMobileTab(activeTabQuery);
    }
  }, [activeTabQuery]);

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  // Superadmin States
  const [activeTab, setActiveTab] = useState('listings');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});

  const toggleUserExpanded = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        showToast('Session expired. Please log in again.', 'error');
        onLogout();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading users directory.', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPurpose, setFilterPurpose] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Input states
  const [searchFocused, setSearchFocused] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null); // Null for Add, Property object for Edit

  const fetchProperties = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        showToast('Session expired. Please log in again.', 'error');
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading properties list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...properties];

    // Search filter (name, location, owner)
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.ownerName.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }

    // Purpose filter
    if (filterPurpose !== 'all') {
      result = result.filter(item => item.purpose === filterPurpose);
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'area-desc') {
      result.sort((a, b) => b.sqryard - a.sqryard);
    }

    setFilteredProperties(result);
  }, [properties, search, filterType, filterPurpose, sortBy]);

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete property');
      }

      showToast('Property deleted successfully.', 'success');
      setProperties(prev => prev.filter(item => item._id !== id));
      if (admin.username === 'admin') {
        fetchUsers(); // Refresh users list to update listings counts
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error deleting property', 'error');
    }
  };

  const handleEditClick = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedProperty(null);
    setIsModalOpen(true);
  };

  const handleLogoClick = () => {
    handleTabChange('overview');
    if (admin.username === 'admin') {
      setActiveTab('listings');
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
    fetchProperties(); // Refresh list
    if (admin.username === 'admin') {
      fetchUsers(); // Refresh users list to update property states
    }
  };

  // Stats Calculations
  const stats = {
    total: properties.length,
    totalArea: properties.reduce((acc, item) => acc + (item.sqryard || 0), 0),
    leaseCount: properties.filter(item => item.purpose === 'lease').length,
    sellCount: properties.filter(item => item.purpose === 'sell').length,
  };

  // Helper renderers for responsive layout
  const renderMetricsGrid = () => {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200/80 group">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Listings</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.total}</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50/70 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform order-first sm:order-last shrink-0">
            <LayoutGrid size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200/80 group">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-405 uppercase tracking-widest">Total Area Covered</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.totalArea.toLocaleString('en-IN')} sqyd</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-50/70 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform order-first sm:order-last shrink-0">
            <Ruler size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200/80 group">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-405 uppercase tracking-widest">Properties For Lease</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.leaseCount}</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50/70 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform order-first sm:order-last shrink-0">
            <Activity size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200/80 group">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-405 uppercase tracking-widest">Properties For Sale</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.sellCount}</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-50/70 text-cyan-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform order-first sm:order-last shrink-0">
            <TrendingUp size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>
      </section>
    );
  };

  const renderFilterControls = (isMobile = false) => {
    return (
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center mb-8">
        {/* Search box with focus border */}
        <div className="relative w-full lg:max-w-md flex items-center group">
          <Search 
            className={`absolute left-3.5 transition-colors duration-200 ${
              searchFocused ? 'text-indigo-500' : 'text-slate-400'
            }`} 
            size={16} 
          />
          <input
            type="text"
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
              searchFocused 
                ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-sm shadow-indigo-100/10' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
            placeholder="Search by name, location address, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Filters Select row */}
        <div className={`flex w-full lg:w-auto gap-3 items-center justify-start lg:justify-end ${
          isMobile ? 'flex-col' : 'flex-col sm:flex-row lg:flex-row'
        }`}>
          <select 
            className={`${isMobile ? 'w-full' : 'w-full sm:w-auto'} bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer`}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Property Types</option>
            <option value="flat">Flat / Apartment</option>
            <option value="commercial">Commercial Space</option>
            <option value="bungalow">Bungalow</option>
          </select>

          <select 
            className={`${isMobile ? 'w-full' : 'w-full sm:w-auto'} bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer`}
            value={filterPurpose}
            onChange={(e) => setFilterPurpose(e.target.value)}
          >
            <option value="all">All Listing Purposes</option>
            <option value="sell">For Sale Only</option>
            <option value="lease">For Lease Only</option>
          </select>

          <select 
            className={`${isMobile ? 'w-full' : 'w-full sm:w-auto'} bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer`}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="area-desc">Area: Largest First</option>
          </select>
        </div>
      </section>
    );
  };

  const renderPropertiesListing = () => {
    return (
      <section className="relative min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin-custom"></div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Loading listings data...</span>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <PropertyCard
                key={property._id}
                property={property}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                showToast={showToast}
                onViewDetails={(prop) => navigate(`/property/${prop._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl shadow-sm text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
              <Inbox size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Listings Available</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1 mb-6">
              {properties.length === 0 
                ? "You haven't listed any property yet. Tap 'List Property' at the top to upload your first space description." 
                : "We couldn't find any listings matching your search keyword or selected parameters."
              }
            </p>
            {properties.length > 0 && (
              <button 
                type="button" 
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                onClick={() => {
                  setSearch('');
                  setFilterType('all');
                  setFilterPurpose('all');
                  setSortBy('newest');
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </section>
    );
  };

  const renderUsersDirectory = () => {
    if (usersLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin-custom"></div>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Fetching users directory...</span>
        </div>
      );
    }

    const totalUsers = users.length;
    const totalPropertiesCount = users.reduce((acc, u) => acc + u.properties.length, 0);

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Title Block */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Users Directory</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Monitor registered dashboard accounts and manage their uploaded property listings.
          </p>
        </div>

        {/* User Stats Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200/80 group">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registered Users</span>
              <span className="text-2xl font-black text-slate-800 mt-1">{totalUsers}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200/80 group">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Property Listings</span>
              <span className="text-2xl font-black text-slate-800 mt-1">{totalPropertiesCount}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/70 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <LayoutGrid size={20} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-200/80 group">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Listings / User</span>
              <span className="text-2xl font-black text-slate-800 mt-1">
                {totalUsers > 0 ? (totalPropertiesCount / totalUsers).toFixed(1) : 0}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50/70 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Activity size={20} />
            </div>
          </div>
        </section>

        {/* Users Card List */}
        <div className="space-y-4">
          {users.map(user => {
            const isExpanded = expandedUsers[user._id];
            return (
              <div 
                key={user._id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* User Row Header */}
                <div 
                  className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/30 transition-colors"
                  onClick={() => toggleUserExpanded(user._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-100">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-base">{user.username}</span>
                        {user.role === 'superadmin' || user.username === 'admin' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                            Superadmin
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-150">
                            User
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-xs font-semibold mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Email: {user.email}</span>
                        <span>Google Login: {user.googleId}</span>
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Properties Added</span>
                      <span className="text-lg font-black text-slate-800">{user.properties.length} listings</span>
                    </div>
                    <button 
                      type="button"
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Property List Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/20 px-6 pb-6 pt-2 animate-toast-slide-in">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 mt-2">
                      Listing Details for {user.username}
                    </h4>

                    {user.properties.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-slate-100 text-left font-sans">
                          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                              <th className="px-4 py-3.5">Property Title</th>
                              <th className="px-4 py-3.5">Type</th>
                              <th className="px-4 py-3.5">Location</th>
                              <th className="px-4 py-3.5">Purpose</th>
                              <th className="px-4 py-3.5 text-right">Price</th>
                              <th className="px-4 py-3.5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                            {user.properties.map(prop => (
                              <tr key={prop._id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-4 py-3.5 font-bold text-slate-800">{prop.title}</td>
                                <td className="px-4 py-3.5 capitalize">{prop.type}</td>
                                <td className="px-4 py-3.5 max-w-[180px] truncate">{prop.location}</td>
                                <td className="px-4 py-3.5 capitalize">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    prop.purpose === 'sell' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {prop.purpose}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-black text-slate-800">
                                  ₹{prop.price.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3.5 text-center flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(prop);
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm('Are you sure you want to delete this property listing?')) {
                                        await handleDelete(prop._id);
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-bold border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
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
                      <div className="p-8 bg-white border border-slate-100 rounded-2xl text-center text-slate-400 font-medium text-xs">
                        This user hasn't added any property listings yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col bg-grid-pattern relative overflow-x-hidden">
      
      {/* Decorative blurred spots */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer active:scale-[0.98] transition-all select-none group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors shrink-0">
                <Building2 size={16} className="sm:w-4.5 sm:h-4.5" />
              </div>
              <span className="font-extrabold text-sm sm:text-lg text-slate-800 tracking-tight truncate max-w-[100px] xs:max-w-none sm:overflow-visible group-hover:text-indigo-600 transition-colors">
                Horizon Properties
              </span>
            </div>
            
            {admin.username === 'admin' && (
              <div className="flex items-center gap-0.5 ml-1 sm:ml-6 bg-slate-150/60 p-0.5 rounded-lg border border-slate-200/40">
                <button
                  type="button"
                  onClick={() => { setActiveTab('listings'); }}
                  className={`px-1.5 sm:px-2.5 py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'listings' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Listings
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('users'); }}
                  className={`px-1.5 sm:px-2.5 py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'users' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Users
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              type="button" 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-slate-700 text-[10px] sm:text-xs font-bold shadow-sm transition-all hover:bg-slate-100/50 cursor-pointer active:scale-95 shrink-0"
              title="Edit Profile"
            >
              {admin.profileImage ? (
                <img 
                  src={admin.profileImage} 
                  alt={admin.username} 
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover shrink-0" 
                />
              ) : (
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[8px] sm:text-[10px] shrink-0">
                  {admin.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate max-w-[60px] sm:max-w-none">
                {admin.username.length > 12 ? admin.username.slice(0, 10) + '...' : admin.username}
              </span>
            </button>
            
            <button 
              type="button" 
              className="p-2 sm:p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Logout" 
              onClick={handleLogoutClick}
            >
              <LogOut size={14} className="sm:w-[15px] sm:h-[15px]" />
            </button>
          </div>
        </div>
      </header>      
      
      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 py-8 z-10 pb-24 md:pb-8">
        {activeTab === 'listings' ? (
          <>
            {/* DESKTOP VIEW - Single Page Layout */}
            <div className="hidden md:block">
              {/* Title / Action Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    {admin.username === 'admin' ? 'Global Listings' : 'Dashboard Overview'}
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                    {admin.username === 'admin' 
                      ? 'Global view of all property listings uploaded by your dashboard users.'
                      : 'List new flat/commercial space/bungalows, update existing details, and track owners contact details.'
                    }
                  </p>
                </div>
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-xl hover:shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer"
                  onClick={handleAddClick}
                >
                  <Plus size={16} /> List Property
                </button>
              </div>

              {/* Metrics Grid */}
              {renderMetricsGrid()}

              {/* Filter Controls Row */}
              {renderFilterControls(false)}

              {/* Properties Listing */}
              {renderPropertiesListing()}
            </div>

            {/* MOBILE VIEW - Dynamic Tab Switcher */}
            <div className="block md:hidden space-y-6">
              {mobileTab === 'overview' && (
                    <div className="space-y-6 animate-modal-enter">
                      <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Overview</h1>
                        <p className="text-slate-500 text-xs mt-1 font-medium">
                          Quick summary of your listed properties and covered land area.
                        </p>
                      </div>

                      <div className="p-5 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-600/10 animate-toast-slide-in">
                        <h3 className="text-sm font-extrabold">Welcome back, {admin.username}!</h3>
                        <p className="text-indigo-100 text-[10px] font-bold mt-1.5 leading-relaxed">
                          Use the bottom tabs to manage your properties, list new properties, or customize your settings.
                        </p>
                      </div>
                      
                      {renderMetricsGrid()}
                    </div>
                  )}

                  {mobileTab === 'listings' && (
                    <div className="space-y-6 animate-modal-enter">
                      <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Listings</h1>
                        <p className="text-slate-500 text-xs mt-1 font-medium">
                          Manage your flat, commercial, or bungalow properties.
                        </p>
                      </div>

                      {/* Mobile Search & Filter Button Row */}
                      <div className="flex gap-2.5">
                        <div className="relative flex-1 flex items-center">
                          <Search className="absolute left-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-400"
                            placeholder="Search location, address or title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFilterDrawerOpen(true)}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                        >
                          <SlidersHorizontal size={18} />
                        </button>
                      </div>

                      {/* Properties Found Count Row */}
                      <div className="flex items-center justify-between px-1 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/80">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {filteredProperties.length} Properties Found
                        </span>
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/50">
                          {sortBy === 'newest' ? 'Newest' : sortBy === 'price-asc' ? 'Price: Low-High' : sortBy === 'price-desc' ? 'Price: High-Low' : 'Area: Largest'}
                        </span>
                      </div>

                      {renderPropertiesListing()}
                    </div>
                  )}

                  {mobileTab === 'add-listing' && (
                    <div className="space-y-6 animate-modal-enter">
                      <PropertyModal
                        inline={true}
                        onClose={() => setMobileTab('listings')}
                        onSaved={() => {
                          setMobileTab('listings');
                          fetchProperties();
                        }}
                        showToast={showToast}
                      />
                    </div>
                  )}

                  {mobileTab === 'settings' && (
                    <div className="space-y-6 animate-modal-enter">
                      <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Settings</h1>
                        <p className="text-slate-500 text-xs mt-1 font-medium">
                          Manage your profile information and session controls.
                        </p>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-100 bg-slate-50 flex items-center justify-center shadow-md relative mb-4">
                          {admin.profileImage ? (
                            <img 
                              src={admin.profileImage} 
                              alt={admin.username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-2xl font-black">
                              {admin.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-800">{admin.username}</h3>
                        <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{admin.email || 'No email configured'}</span>
                        
                        <div className="w-full grid grid-cols-2 border-t border-slate-100 mt-6 pt-5 gap-4">
                          <button
                            type="button"
                            onClick={() => setIsProfileModalOpen(true)}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm animate-fade-in"
                          >
                            Edit Profile
                          </button>
                          <button
                            type="button"
                            onClick={handleLogoutClick}
                            className="w-full py-3.5 border border-slate-200 text-slate-655 hover:bg-slate-50 hover:text-slate-800 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          </>
        ) : (
          renderUsersDirectory()
        )}
      </main>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/60 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] px-4 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => handleTabChange('overview')}
          className="flex flex-col items-center justify-center cursor-pointer min-w-[64px]"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            mobileTab === 'overview' ? 'bg-slate-900 text-amber-500 shadow-md animate-toast-slide-in' : 'text-slate-400'
          }`}>
            <LayoutGrid size={20} />
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            mobileTab === 'overview' ? 'text-slate-900 font-extrabold' : 'text-slate-400'
          }`}>
            Overview
          </span>
          <div className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-all ${
            mobileTab === 'overview' ? 'bg-amber-500' : 'bg-transparent'
          }`} />
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('listings')}
          className="flex flex-col items-center justify-center cursor-pointer min-w-[64px]"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            mobileTab === 'listings' ? 'bg-slate-900 text-amber-500 shadow-md animate-toast-slide-in' : 'text-slate-400'
          }`}>
            <List size={20} />
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            mobileTab === 'listings' ? 'text-slate-900 font-extrabold' : 'text-slate-400'
          }`}>
            My Listing
          </span>
          <div className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-all ${
            mobileTab === 'listings' ? 'bg-amber-500' : 'bg-transparent'
          }`} />
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('add-listing')}
          className="flex flex-col items-center justify-center cursor-pointer min-w-[64px]"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            mobileTab === 'add-listing' ? 'bg-slate-900 text-amber-500 shadow-md animate-toast-slide-in' : 'text-slate-400'
          }`}>
            <Plus size={20} />
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            mobileTab === 'add-listing' ? 'text-slate-900 font-extrabold' : 'text-slate-400'
          }`}>
            Add Listing
          </span>
          <div className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-all ${
            mobileTab === 'add-listing' ? 'bg-amber-500' : 'bg-transparent'
          }`} />
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('settings')}
          className="flex flex-col items-center justify-center cursor-pointer min-w-[64px]"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            mobileTab === 'settings' ? 'bg-slate-900 text-amber-500 shadow-md animate-toast-slide-in' : 'text-slate-400'
          }`}>
            <Settings size={20} />
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            mobileTab === 'settings' ? 'text-slate-900 font-extrabold' : 'text-slate-400'
          }`}>
            Settings
          </span>
          <div className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-all ${
            mobileTab === 'settings' ? 'bg-amber-500' : 'bg-transparent'
          }`} />
        </button>
      </div>

      {/* Filters Bottom Sheet Drawer for Mobile */}
      {isFilterDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden flex items-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          
          {/* Drawer Sheet */}
          <div className="relative w-full bg-white rounded-t-[32px] shadow-2xl p-6 pb-8 flex flex-col max-h-[90vh] z-50 animate-modal-enter border border-slate-100">
            {/* Grabber/Handle bar */}
            <div className="w-12 h-1 bg-amber-100/80 rounded-full mx-auto mb-6 shrink-0" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm tracking-wider uppercase">
                <SlidersHorizontal size={16} className="text-amber-600" />
                <span>Filters</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setFilterType('all');
                    setFilterPurpose('all');
                    setSortBy('newest');
                  }}
                  className="text-amber-600 hover:text-amber-700 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Reset All
                </button>
                <button 
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-slate-100 -mx-6 mb-5" />

            {/* Filter Fields Content */}
            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              {/* Property Category */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Property Category
                </label>
                <CustomSelect
                  value={filterType}
                  onChange={setFilterType}
                  options={[
                    { value: 'all', label: 'Any Category' },
                    { value: 'flat', label: 'Flat / Apartment' },
                    { value: 'commercial', label: 'Commercial Space' },
                    { value: 'bungalow', label: 'Bungalow / Villa' }
                  ]}
                />
              </div>

              {/* Listing Purpose */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Listing Purpose
                </label>
                <CustomSelect
                  value={filterPurpose}
                  onChange={setFilterPurpose}
                  options={[
                    { value: 'all', label: 'Any Purpose' },
                    { value: 'sell', label: 'For Sale Only' },
                    { value: 'lease', label: 'For Lease / Rent' }
                  ]}
                />
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Sort Properties
                </label>
                <CustomSelect
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'newest', label: 'Sort: Newest First' },
                    { value: 'price-asc', label: 'Price: Low to High' },
                    { value: 'price-desc', label: 'Price: High to Low' },
                    { value: 'area-desc', label: 'Area: Largest First' }
                  ]}
                />
              </div>
            </div>

            {/* Bottom Button Row */}
            <div className="mt-6 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 text-center block"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProperty(null);
          }}
          onSaved={handleModalSave}
          showToast={showToast}
        />
      )}

      {/* Profile Modal Overlay */}
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

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <ConfirmModal
          title="Log Out"
          message="Are you sure you want to log out of your session? You will need to log back in to manage your listings."
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
    </div>
  );
}
