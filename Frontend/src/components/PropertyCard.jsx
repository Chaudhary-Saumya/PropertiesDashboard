import React, { useState } from 'react';
import { MapPin, Phone, User, Maximize2, Trash2, Edit3, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export default function PropertyCard({ property, onEdit, onDelete, showToast, onViewDetails }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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
    furnishing,
    price,
    images,
    additionalInfo
  } = property;

  const [isFavorite, setIsFavorite] = useState(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(_id);
  });

  const toggleFavorite = (e) => {
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updated;
    if (isFavorite) {
      updated = favorites.filter(id => id !== _id);
      showToast('Removed from favorites', 'info');
    } else {
      updated = [...favorites, _id];
      showToast('Added to favorites!', 'success');
    }
    localStorage.setItem('favorites', JSON.stringify(updated));
    setIsFavorite(!isFavorite);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out this property: ${title} in ${location} for ${formatPrice(price)}`,
        url: window.location.href
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(`${title} - ${location} (${formatPrice(price)})`);
      showToast('Property details copied to clipboard!', 'success');
    }
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const message = encodeURIComponent(`Hi, I am interested in your property "${title}" listed for ${formatPrice(price)}. Is it still available?`);
    window.open(`https://wa.me/${ownerContact}?text=${message}`, '_blank');
  };

  const handleCall = (e) => {
    e.stopPropagation();
    window.open(`tel:${ownerContact}`, '_self');
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const copyContact = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ownerContact);
    showToast('Owner contact copied to clipboard!', 'success');
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <>
      {/* DESKTOP CARD VIEW */}
      <div 
        onClick={() => onViewDetails && onViewDetails(property)}
        className="hidden md:flex bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-col h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/40 hover:border-slate-200/50 group cursor-pointer"
      >
        
        {/* Media Carousel */}
        <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
          {images && images.length > 0 ? (
            <>
              <img 
                src={images[currentImgIndex]} 
                alt={`${title} - view ${currentImgIndex + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {images.length > 1 && (
                <>
                  <button 
                    type="button" 
                    className="absolute top-1/2 -translate-y-1/2 left-2.5 bg-black/40 hover:bg-black/60 text-white w-7 h-7 flex items-center justify-center rounded-full z-10 transition-colors cursor-pointer"
                    onClick={prevImage}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    type="button" 
                    className="absolute top-1/2 -translate-y-1/2 right-2.5 bg-black/40 hover:bg-black/60 text-white w-7 h-7 flex items-center justify-center rounded-full z-10 transition-colors cursor-pointer"
                    onClick={nextImage}
                  >
                    <ChevronRight size={14} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
              <Maximize2 size={24} className="text-slate-300" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">No images listed</span>
            </div>
          )}

          {/* Categories Badges */}
          <div className="absolute top-3.5 left-3.5 flex gap-1.5 z-10">
            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg text-white tracking-widest shadow-sm ${
              type === 'flat' ? 'bg-indigo-600' :
              type === 'commercial' ? 'bg-purple-600' : 'bg-amber-600'
            }`}>
              {type}
            </span>
            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg text-white tracking-widest shadow-sm ${
              purpose === 'lease' ? 'bg-emerald-600' : 'bg-sky-600'
            }`}>
              {purpose}
            </span>
          </div>

          {/* Floating actions */}
          <div className="absolute top-3.5 right-3.5 flex gap-1.5 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 translate-y-0 md:translate-y-1 md:group-hover:translate-y-0">
            <button 
              type="button" 
              className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all cursor-pointer" 
              title="Edit Listing"
              onClick={(e) => { e.stopPropagation(); onEdit(property); }}
            >
              <Edit3 size={13} />
            </button>
            <button 
              type="button" 
              className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer" 
              title="Delete Listing"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
                  onDelete(_id);
                }
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Card Details */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Pricing */}
          <div className="text-xl font-black text-slate-800 flex items-baseline gap-1">
            {formatPrice(price)}
            {purpose === 'lease' && <span className="text-[10px] font-bold text-slate-400 tracking-wider">/ month</span>}
          </div>

          {/* Title */}
          <h3 className="text-base font-extrabold text-slate-800 mt-1 line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer" title={title}>
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1.5 min-h-[32px] line-clamp-2 leading-relaxed">
            <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span>{location}</span>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 border-y border-slate-100 py-3 my-4">
            <div className="flex flex-col items-center justify-center border-r border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimension</span>
              <span className="text-xs font-black text-slate-700 mt-1">{sqryard} sqyd</span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flat No.</span>
              <span className="text-xs font-black text-slate-700 mt-1">{flatNumber || 'N/A'}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Furnishing</span>
              <span className={`text-[9px] font-black mt-1 px-1.5 py-0.5 rounded-md ${
                furnishing === 'furnished' ? 'bg-emerald-50 text-emerald-700' :
                furnishing === 'semiFurnished' ? 'bg-amber-50 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {furnishing === 'furnished' ? 'Furnished' : furnishing === 'semiFurnished' ? 'Semi-Furn.' : 'Unfurnished'}
              </span>
            </div>
          </div>

          {/* Owner Details Card */}
          <div className="bg-slate-50/80 border border-slate-200/30 rounded-2xl p-3 text-xs mb-4">
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Owner Name</span>
              <span className="font-extrabold text-slate-700">{ownerName}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Contact No</span>
              <span className="font-extrabold text-slate-700">
                {showContact ? (
                  <span 
                    onClick={copyContact} 
                    title="Click to copy phone number" 
                    className="cursor-pointer text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-dashed underline-offset-2"
                  >
                    {ownerContact}
                  </span>
                ) : (
                  <button 
                    type="button" 
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-black transition-colors cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); setShowContact(true); }}
                  >
                    <Phone size={10} /> Show Contact
                  </button>
                )}
              </span>
            </div>
          </div>

          {/* Collapsible Info */}
          {additionalInfo && (
            <div className="mt-auto border-t border-slate-100 pt-3">
              <button 
                type="button" 
                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-660 transition-colors cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
              >
                <span className="flex items-center gap-1">
                  <Info size={12} className="text-slate-400" /> Additional Info
                </span>
                <span>{showInfo ? 'Hide' : 'Show'}</span>
              </button>
              {showInfo && (
                <p className="text-xs text-slate-500 bg-slate-50/50 border border-slate-100 rounded-2xl p-3.5 mt-2 leading-relaxed">
                  {additionalInfo}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE CARD VIEW (Horizontal layout matching the mockup) */}
      <div 
        onClick={() => onViewDetails && onViewDetails(property)}
        className="flex md:hidden bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-row w-full min-h-[145px] transition-all duration-300 hover:shadow-md cursor-pointer active:scale-[0.99] relative"
      >
        {/* Left column - Image */}
        <div className="relative w-[38%] bg-slate-50 shrink-0 overflow-hidden">
          {images && images.length > 0 ? (
            <img 
              src={images[0]} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1 bg-slate-50">
              <Maximize2 size={18} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">No Image</span>
            </div>
          )}

          {/* Map location pin overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-90">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center animate-ping absolute"></div>
            {/* <MapPin size={22} className="text-blue-500 drop-shadow-md relative z-10" /> */}
          </div>

          {/* Action buttons overlay vertical stack on the right edge of the image */}
          <div className="absolute top-2 right-1.5 flex flex-col gap-1.5 z-10">
            {/* Call */}
            <button
              type="button"
              onClick={handleCall}
              className="w-7 h-7 rounded-full bg-slate-900 text-amber-500 hover:bg-slate-800 shadow-md flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <Phone size={11} />
            </button>
          </div>
        </div>

        {/* Right column - Details */}
        <div className="w-[62%] p-3.5 flex flex-col justify-between">
          <div className="space-y-1">
            {/* Title */}
            <h3 className="font-extrabold text-slate-800 text-base line-clamp-1 leading-snug">
              {title}
            </h3>

            {/* Category / Type description */}
            <div className="text-[11px] text-slate-500 font-medium line-clamp-1">
              <span className="font-bold text-slate-700">
                {type === 'flat' ? 'Flat' : type === 'commercial' ? 'Commercial' : 'Bungalow'}
              </span>{' '}
              in {location}
            </div>

            {/* Price & Dimension row */}
            <div className="flex items-center gap-2 pt-1.5 flex-wrap">
              <span className="text-base font-black text-slate-900">
                {formatPrice(price)}
              </span>
              <span className="bg-[#fdf6e2] text-[#b58034] text-[10px] font-black px-2 py-0.5 rounded-lg border border-[#f5e8c4] shrink-0">
                {sqryard} gaj
              </span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                furnishing === 'furnished' ? 'bg-emerald-50 text-emerald-700' :
                furnishing === 'semiFurnished' ? 'bg-amber-50 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {furnishing === 'furnished' ? 'Furnished' : furnishing === 'semiFurnished' ? 'Semi-Furn.' : 'Unfurnished'}
              </span>
            </div>
          </div>

          {/* Location row */}
          <div className="flex items-start gap-1 text-[10px] text-slate-500 mt-2 leading-relaxed">
            <MapPin size={12} className="text-amber-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{location}</span>
          </div>
        </div>
      </div>
    </>
  );
}
