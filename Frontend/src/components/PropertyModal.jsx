import React, { useState, useEffect } from 'react';
import { X, UploadCloud, MapPin, Building, Phone, User, Info, DollarSign, Ruler, Hash } from 'lucide-react';
import CustomSelect from './CustomSelect';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function PropertyModal({ property, onClose, onSaved, showToast, inline = false }) {
  const isEdit = !!property;
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('flat');
  const [location, setLocation] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [sqryard, setSqryard] = useState('');
  const [purpose, setPurpose] = useState('sell');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (property) {
      setTitle(property.title || '');
      setType(property.type || 'flat');
      setLocation(property.location || '');
      setOwnerName(property.ownerName || '');
      setOwnerContact(property.ownerContact || '');
      setFlatNumber(property.flatNumber || '');
      setSqryard(property.sqryard || '');
      setPurpose(property.purpose || 'sell');
      setPrice(property.price || '');
      setImages(property.images || []);
      setAdditionalInfo(property.additionalInfo || '');
    }
  }, [property]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > 10) {
      showToast('Maximum 10 images are allowed.', 'error');
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'File upload failed');
      }

      setImages(prev => [...prev, ...data.urls]);
      showToast('Images uploaded successfully to Cloudinary!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error uploading images', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !location.trim() || !ownerName.trim() || !ownerContact.trim() || !sqryard || !price) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (isNaN(sqryard) || Number(sqryard) <= 0) {
      showToast('Square yards must be a valid positive number.', 'error');
      return;
    }

    if (isNaN(price) || Number(price) <= 0) {
      showToast('Price must be a valid positive number.', 'error');
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');

    const payload = {
      title,
      type,
      location,
      ownerName,
      ownerContact,
      flatNumber,
      sqryard: Number(sqryard),
      purpose,
      price: Number(price),
      images,
      additionalInfo
    };

    const url = isEdit ? `${API_BASE}/properties/${property._id}` : `${API_BASE}/properties`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save property');
      }

      showToast(isEdit ? 'Property updated successfully!' : 'Property added successfully!', 'success');
      onSaved();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error saving property', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={`flex flex-col flex-grow ${inline ? '' : 'overflow-hidden'}`}>
      <div className={`p-6 space-y-6 ${inline ? '' : 'overflow-y-auto'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Title */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="modal-title" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Property Name / Title *
            </label>
            <input
              id="modal-title"
              type="text"
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
                focusedField === 'title' 
                  ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-inner' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              placeholder="e.g. Luxury 3BHK Apartment or Commercial Office Space"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              required
            />
          </div>

          {/* Property Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Property Type *
            </label>
            <CustomSelect
              value={type}
              onChange={setType}
              options={[
                { value: 'flat', label: 'Flat / Apartment' },
                { value: 'commercial', label: 'Commercial Space' },
                { value: 'bungalow', label: 'Bungalow / Villa' }
              ]}
            />
          </div>

          {/* Purpose */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Listing Purpose *
            </label>
            <CustomSelect
              value={purpose}
              onChange={setPurpose}
              options={[
                { value: 'sell', label: 'For Sale' },
                { value: 'lease', label: 'For Lease / Rent' }
              ]}
            />
          </div>

          {/* Location */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="modal-location" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Location Address *
            </label>
            <div className="relative flex items-center">
              <MapPin className={`absolute left-3.5 transition-colors ${focusedField === 'location' ? 'text-indigo-500' : 'text-slate-400'}`} size={16} />
              <input
                id="modal-location"
                type="text"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
                  focusedField === 'location' 
                    ? 'border-indigo-500 ring-4 ring-indigo-500/5' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                placeholder="e.g. Sector 62, Noida, UP, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>

          {/* Square Yards */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-sqryard" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Square Yards (sqryard) *
            </label>
            <div className="relative flex items-center">
              <Ruler className={`absolute left-3.5 transition-colors ${focusedField === 'sqryard' ? 'text-indigo-500' : 'text-slate-400'}`} size={16} />
              <input
                id="modal-sqryard"
                type="number"
                min="1"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
                  focusedField === 'sqryard' 
                    ? 'border-indigo-500 ring-4 ring-indigo-500/5' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                placeholder="e.g. 150"
                value={sqryard}
                onChange={(e) => setSqryard(e.target.value)}
                onFocus={() => setFocusedField('sqryard')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>

          {/* Flat Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-flatnumber" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Flat / Shop / House Number
            </label>
            <div className="relative flex items-center">
              <Hash className={`absolute left-3.5 transition-colors ${focusedField === 'flatNumber' ? 'text-indigo-500' : 'text-slate-400'}`} size={16} />
              <input
                id="modal-flatnumber"
                type="text"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
                  focusedField === 'flatNumber' 
                    ? 'border-indigo-500 ring-4 ring-indigo-500/5' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                placeholder="e.g. B-402 (Optional)"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                onFocus={() => setFocusedField('flatNumber')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-price" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {purpose === 'lease' ? 'Price Per Month (INR) *' : 'Total Sale Price (INR) *'}
            </label>
            <div className="relative flex items-center">
              <DollarSign className={`absolute left-3.5 transition-colors ${focusedField === 'price' ? 'text-indigo-500' : 'text-slate-400'}`} size={16} />
              <input
                id="modal-price"
                type="number"
                min="1"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
                  focusedField === 'price' 
                    ? 'border-indigo-500 ring-4 ring-indigo-500/5' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                placeholder={purpose === 'lease' ? 'e.g. 25000' : 'e.g. 8500000'}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>

          {/* Owner Information Section Header */}
          <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-5 mt-2">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                <User size={14} />
              </div>
              Owner Information
            </h4>
          </div>

          {/* Owner Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-ownername" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Owner Name *
            </label>
            <input
              id="modal-ownername"
              type="text"
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
                focusedField === 'ownerName' 
                  ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-inner' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              placeholder="e.g. Rajesh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              onFocus={() => setFocusedField('ownerName')}
              onBlur={() => setFocusedField(null)}
              required
            />
          </div>

          {/* Owner Contact */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-ownercontact" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Owner Contact Number *
            </label>
            <div className="relative flex items-center">
              <Phone className={`absolute left-3.5 transition-colors ${focusedField === 'ownerContact' ? 'text-indigo-500' : 'text-slate-400'}`} size={16} />
              <input
                id="modal-ownercontact"
                type="tel"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 ${
                  focusedField === 'ownerContact' 
                    ? 'border-indigo-500 ring-4 ring-indigo-500/5' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                placeholder="e.g. 9876543210"
                value={ownerContact}
                onChange={(e) => setOwnerContact(e.target.value)}
                onFocus={() => setFocusedField('ownerContact')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>

          {/* Media Section Header */}
          <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-5 mt-2">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                <Building size={14} />
              </div>
              Media & Description
            </h4>
          </div>

          {/* Cloudinary Drag/Drop Uploader */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Property Images</label>
            <label 
              htmlFor="image-file-upload" 
              className="border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/5 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2.5 group"
            >
              <UploadCloud size={32} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <div>
                <p className="text-sm font-bold text-slate-600">Select images to upload</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supports JPG, PNG, WEBP (Max 10 files)</p>
              </div>
              <input
                id="image-file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            
            {isUploading && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1.5 ml-1">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin-custom"></div>
                Uploading files to Cloudinary...
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-3">
                {images.map((url, idx) => (
                  <div key={url} className="relative aspect-square border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    <img src={url} alt={`Upload preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImage(idx)} 
                      title="Delete image"
                      className="absolute top-1.5 right-1.5 bg-slate-900/60 text-white rounded-full p-1 hover:bg-slate-900/80 transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="modal-info" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Additional Details & notes
            </label>
            <textarea
              id="modal-info"
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white transition-all placeholder:text-slate-400/80 min-h-[100px] resize-y ${
                focusedField === 'additionalInfo' 
                  ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-inner' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              placeholder="Add properties details, amenities, landmarks, security deposit, availability timelines, etc."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              onFocus={() => setFocusedField('additionalInfo')}
              onBlur={() => setFocusedField(null)}
            />
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
        {onClose && (
          <button 
            type="button" 
            className="px-5 py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-[0.99] cursor-pointer" 
            onClick={onClose}
            disabled={isSaving || isUploading}
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] cursor-pointer"
          disabled={isSaving || isUploading}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-custom"></div>
          ) : (
            isEdit ? 'Save Changes' : 'List Property'
          )}
        </button>
      </div>
    </form>
  );

  if (inline) {
    return (
      <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-modal-enter flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 p-3">{isEdit ? 'Edit Property Listing' : 'List New Property'}</h3>
          {onClose && (
            <button 
              type="button" 
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-xl cursor-pointer" 
              onClick={onClose}
            >
              <X size={18} />
            </button>
          )}
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 p-3">{isEdit ? 'Edit Property Listing' : 'List New Property'}</h3>
          <button 
            type="button" 
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-xl cursor-pointer" 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        {formContent}
      </div>
    </div>
  );
}
