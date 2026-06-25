import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, User, Maximize2, Trash2, Edit3,
  ChevronLeft, ChevronRight, Info, ArrowLeft, Heart,
  Share2, MessageSquare, Copy, Check, ExternalLink,
  Building2, LogOut
} from 'lucide-react';
import PropertyModal from './PropertyModal';
import ConfirmModal from './ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function PropertyDetailsPage({ property, onClose, onEdit, onDelete, showToast, admin, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [localProperty, setLocalProperty] = useState(property || null);
  const [isLoading, setIsLoading] = useState(!localProperty);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [displayUnit, setDisplayUnit] = useState('sqyard'); // 'sqyard' | 'sqmtr' | 'sqfoot'

  // Sync selectedPropertyDetails when property prop changes
  useEffect(() => {
    if (property) {
      setLocalProperty(property);
    }
  }, [property]);

  // Fetch property by ID if not loaded
  useEffect(() => {
    if (localProperty) return;

    const fetchProperty = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/properties/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          showToast('Session expired. Please log in again.', 'error');
          localStorage.removeItem('token');
          localStorage.removeItem('admin');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Property not found or access denied');
        }

        const data = await response.json();
        setLocalProperty(data);
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Error loading property details.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id, localProperty, navigate, showToast]);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (localProperty?._id) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favorites.includes(localProperty._id));
    }
  }, [localProperty]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin-custom"></div>
        <span className="font-medium tracking-wide">Loading property details...</span>
      </div>
    );
  }

  if (!localProperty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600 gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner mb-2">
          <Info size={28} />
        </div>
        <h3 className="text-lg font-black text-slate-800">Property Not Found</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-1 mb-4">
          The property listing you are trying to view does not exist or may have been deleted.
        </p>
        <button
          onClick={() => navigate(admin?.username === 'admin' ? '/superadmin' : '/dashboard')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const {
    _id,
    title,
    type,
    location,
    ownerName,
    ownerContact,
    flatNumber,
    sqryard,
    purpose,
    price,
    images,
    additionalInfo
  } = localProperty;

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updated;
    if (isFavorite) {
      updated = favorites.filter(favId => favId !== _id);
      showToast('Removed from favorites', 'info');
    } else {
      updated = [...favorites, _id];
      showToast('Added to favorites!', 'success');
    }
    localStorage.setItem('favorites', JSON.stringify(updated));
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        url: shareUrl
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi, I am interested in your property "${title}" listed for ${formatPrice(price)}. Is it still available?`);
    window.open(`https://wa.me/${ownerContact}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:${ownerContact}`, '_self');
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(location);
    setCopiedAddress(true);
    showToast('Address copied to clipboard!', 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const nextImage = () => {
    if (!images || images.length <= 1) return;
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!images || images.length <= 1) return;
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      nextImage();
    }
    if (touchStart - touchEnd < -50) {
      prevImage();
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Area conversion from sq yards
  const convertArea = (sqyd, unit) => {
    const n = Number(sqyd);
    if (unit === 'sqmtr') return +(n / 1.19599).toFixed(2);
    if (unit === 'sqfoot') return +(n * 9).toFixed(2);
    return +n.toFixed(4);
  };

  const unitLabels = { sqyard: 'sq yd', sqmtr: 'sq m', sqfoot: 'sq ft' };
  const areaUnits = ['sqyard', 'sqmtr', 'sqfoot'];
  const displayedArea = convertArea(sqryard, displayUnit);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(localProperty);
    } else {
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteConfirmOpen(false);

    if (onDelete) {
      await onDelete(_id);
      if (onClose) onClose();
      else navigate(admin?.username === 'admin' ? '/superadmin' : '/dashboard');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/properties/${_id}`, {
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
      navigate(admin?.username === 'admin' ? '/superadmin' : '/dashboard');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error deleting property', 'error');
    }
  };

  const handleBackClick = () => {
    if (onClose) onClose();
    else navigate(admin?.role === 'superadmin' ? '/dashboard' : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative overflow-x-hidden">
      {/* Decorative blurred spots */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none" />

      {/* Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <div
            onClick={handleBackClick}
            className="flex items-center gap-2 cursor-pointer active:scale-[0.98] transition-all select-none group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors shrink-0">
              <Building2 size={16} />
            </div>
            <span className="font-extrabold text-sm sm:text-lg text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors hidden xs:block">
              Horizon Properties
            </span>
          </div>

          {/* Right side: page breadcrumb label + user controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Page label badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
              Property Details
            </span>

            {/* Back button */}
            <button
              type="button"
              onClick={handleBackClick}
              className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-full transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <ArrowLeft size={12} />
              Back to Listings
            </button>

            {/* Admin avatar pill */}
            {admin && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/80 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full shadow-sm shrink-0">
                {admin.profileImage ? (
                  <img
                    src={admin.profileImage}
                    alt={admin.username}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[8px] sm:text-[10px] shrink-0">
                    {admin.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-slate-700 text-[10px] sm:text-xs font-bold truncate max-w-[60px] sm:max-w-[120px]">
                  {admin.username && admin.username.length > 12 ? admin.username.slice(0, 10) + '...' : admin.username}
                </span>
              </div>
            )}

            {/* Logout button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className="p-2 sm:p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="animate-modal-enter w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-8">
          {/* Header back navigation and actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (onClose) onClose();
                else navigate(admin?.username === 'admin' ? '/superadmin' : '/dashboard');
              }}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer group py-2"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              Back to Listings
            </button>

            <div className="flex gap-2">
              {/* Share */}
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-2xl bg-white text-slate-500 border border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/50 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                title="Share Details"
              >
                <Share2 size={16} strokeWidth={2.5} />
              </button>

              {/* Edit/Delete Admin Control options */}
              <button
                onClick={handleEdit}
                className="w-9 h-9 rounded-2xl bg-white text-slate-650 border border-slate-100 hover:border-slate-200/80 hover:bg-indigo-50/50 hover:text-indigo-600 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                title="Edit Listing"
              >
                <Edit3 size={16} />
              </button>

              <button
                onClick={handleDeleteClick}
                className="w-9 h-9 rounded-2xl bg-white text-slate-655 border border-slate-100 hover:border-rose-200/80 hover:bg-rose-50/50 hover:text-rose-600 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                title="Delete Listing"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Main layout grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Images Carousel & Notes */}
            <div className="lg:col-span-7 space-y-6">
              {/* Image carousel container */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-[28px] overflow-hidden bg-slate-900 border border-slate-100/50 shadow-md group">
                {images && images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImgIndex]}
                      alt={`${title} - image ${currentImgIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />

                    {images.length > 1 && (
                      <>
                        {/* Chevrons */}
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/30 hover:bg-black/50 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                        >
                          <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/30 hover:bg-black/50 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                        >
                          <ChevronRight size={20} strokeWidth={2.5} />
                        </button>

                        {/* Dot indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImgIndex(idx)}
                              className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentImgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                            />
                          ))}
                        </div>

                        {/* Image indicator badge */}
                        <div className="absolute top-4 left-4 bg-black/40 text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl backdrop-blur-md tracking-wider">
                          {currentImgIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50">
                    <Maximize2 size={32} className="text-slate-300" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-450">No images listed</span>
                  </div>
                )}
              </div>

              {/* Description Notes Card */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs tracking-wider uppercase">
                  <Info size={16} className="text-indigo-500" />
                  <span>Owner's Description & Notes</span>
                </div>
                <div className="h-px bg-slate-100" />
                {additionalInfo ? (
                  <p className="text-sm text-slate-655 leading-relaxed font-medium whitespace-pre-line">
                    {additionalInfo}
                  </p>
                ) : (
                  <p className="text-xs text-slate-450 italic font-medium leading-relaxed py-2">
                    No additional description or parameter notes uploaded for this property listing. Contact the property owner directly for further specifications.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Structured details & CTAs */}
            <div className="lg:col-span-5 space-y-6">

              {/* Title & Core Specs Panel */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-5">
                {/* Tag Badges */}
                <div className="flex gap-2">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg text-white tracking-widest shadow-sm ${type === 'flat' ? 'bg-indigo-600' :
                      type === 'commercial' ? 'bg-purple-600' : 'bg-amber-600'
                    }`}>
                    {type}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg text-white tracking-widest shadow-sm ${purpose === 'lease' ? 'bg-emerald-600' : 'bg-sky-600'
                    }`}>
                    {purpose === 'lease' ? 'For Lease / Rent' : 'For Sale'}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
                    {title}
                  </h1>
                </div>

                {/* Pricing / Area Stat display block */}
                <div className="bg-slate-50 border border-slate-200/40 rounded-[20px] p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Price</span>
                    <span className="text-xl font-black text-slate-800 mt-1">
                      {formatPrice(price)}
                      {purpose === 'lease' && <span className="text-xs font-bold text-slate-400 tracking-wider">/ mo</span>}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200/85" />
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimension</span>
                    <span className="bg-[#fdf6e2] text-[#b58034] text-xs font-extrabold px-3 py-1 rounded-lg border border-[#f5e8c4] shrink-0">
                      {displayedArea} {unitLabels[displayUnit]}
                    </span>
                    {/* Unit toggle */}
                    <div className="flex gap-0.5 mt-0.5">
                      {areaUnits.map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setDisplayUnit(u)}
                          className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded transition-all ${displayUnit === u
                              ? 'bg-amber-500 text-white'
                              : 'bg-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                          {unitLabels[u]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2x2 Specifications Grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimension</span>
                    <span className="text-sm font-extrabold text-slate-700 mt-1">
                      {displayedArea} {unitLabels[displayUnit]}
                    </span>
                    {/* Unit toggle pills */}
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {areaUnits.map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setDisplayUnit(u)}
                          className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md transition-all ${displayUnit === u
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                          {unitLabels[u]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flat/Plot No</span>
                    <span className="text-sm font-extrabold text-slate-700 mt-1">{flatNumber || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Listing Type</span>
                    <span className="text-sm font-extrabold text-slate-700 mt-1 capitalize">{type}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Purpose</span>
                    <span className="text-sm font-extrabold text-slate-700 mt-1 capitalize">{purpose === 'lease' ? 'Rent' : 'Sale'}</span>
                  </div>
                </div>
              </div>

              {/* Location Address Details Panel */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs tracking-wider uppercase">
                  <MapPin size={16} className="text-amber-500" />
                  <span>Location Address</span>
                </div>
                <div className="h-px bg-slate-100" />
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {location}
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="w-full py-2.5 bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 transition-all font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {copiedAddress ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Full Address</span>
                    </>
                  )}
                </button>
              </div>

              {/* Owner details card & actions */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs tracking-wider uppercase">
                  <User size={16} className="text-indigo-500" />
                  <span>Property Owner Details</span>
                </div>
                <div className="h-px bg-slate-100" />

                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Owner Name</span>
                  <span className="font-extrabold text-slate-700">{ownerName}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-150/40">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Contact No</span>
                  <span className="font-extrabold text-indigo-650 select-all">{ownerContact}</span>
                </div>

                {/* Desktop CTAs inside the panel */}
                <div className="hidden sm:grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleWhatsApp}
                    className="py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <MessageSquare size={14} fill="currentColor" />
                    <span>WhatsApp Chat</span>
                  </button>
                  <button
                    onClick={handleCall}
                    className="py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-500 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Phone size={14} />
                    <span>Call Owner</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sticky Bottom CTA Drawer Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 p-4 px-6 flex gap-3 z-[100] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] rounded-3xl">
            <button
              onClick={handleWhatsApp}
              className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <MessageSquare size={14} fill="currentColor" />
              <span>WhatsApp Chat</span>
            </button>
            <button
              onClick={handleCall}
              className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-500 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Phone size={14} />
              <span>Call Owner</span>
            </button>
          </div>
        </div>
      </main>

      {/* Edit Modal Overlay */}
      {isEditModalOpen && (
        <PropertyModal
          property={localProperty}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={(savedProperty) => {
            setIsEditModalOpen(false);
            if (savedProperty) {
              setLocalProperty(savedProperty);
              showToast('Property updated successfully.', 'success');
            } else {
              setLocalProperty(null); // triggers refetch
            }
          }}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <ConfirmModal
          title="Delete Listing"
          message={`Are you sure you want to permanently delete "${title}"? This listing will be removed forever.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setIsDeleteConfirmOpen(false)}
          type="danger"
          icon={Trash2}
        />
      )}
    </div>
  );
}
