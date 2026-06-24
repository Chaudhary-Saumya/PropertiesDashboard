import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Toggle Button (Trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border px-4.5 py-3 rounded-xl text-slate-700 text-sm font-bold transition-all flex items-center justify-between cursor-pointer text-left shadow-sm active:scale-[0.995] ${
          isOpen 
            ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-inner' 
            : 'border-slate-200 hover:border-slate-350'
        }`}
      >
        <span className="truncate text-slate-800 pl-3">{selectedOption ? selectedOption.label : 'Select option'}</span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} 
        />
      </button>

      {/* Dropdown Options List Container */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-2xl shadow-slate-900/10 z-[100] max-h-60 overflow-y-auto py-1 animate-modal-enter origin-top divide-y divide-slate-50 ">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4.5 py-3.5 text-[13px] transition-colors flex items-center justify-between cursor-pointer ${
                option.value === value 
                  ? 'bg-indigo-50/60 text-indigo-600 font-extrabold' 
                  : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 font-semibold'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <Check size={14} className="text-indigo-650 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
