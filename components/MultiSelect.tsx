import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: number;
  label: string;
  subLabel?: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

export default function MultiSelect({ options, selectedIds, onChange, placeholder = "Selecione..." }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(o => selectedIds.includes(o.id));
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(v => v !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="min-h-[48px] w-full border border-[#cbd5e1] rounded-xl bg-white p-2 flex flex-wrap gap-2 cursor-pointer focus-within:border-[#3b82f6] focus-within:ring-1 focus-within:ring-[#3b82f6] transition-all"
        onClick={() => setIsOpen(true)}
      >
        {selectedOptions.length === 0 && !searchTerm && (
          <span className="text-[#64748b] p-1 px-2 text-sm">{placeholder}</span>
        )}
        
        {selectedOptions.map(opt => (
          <span key={opt.id} className="inline-flex items-center gap-1 bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd] rounded-lg px-2.5 py-1 text-sm font-medium">
            {opt.label}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); toggleOption(opt.id); }}
              className="hover:text-[#0c4a6e] ml-1 focus:outline-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </span>
        ))}
        
        <input 
          type="text" 
          className="flex-1 min-w-[120px] bg-transparent outline-none p-1 text-sm text-[#1e293b]"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOptions.length > 0 ? "" : ""}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-[#cbd5e1] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-sm text-[#64748b] text-center">Nenhuma opção encontrada.</div>
          ) : (
            filteredOptions.map(opt => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <div 
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`p-3 text-sm cursor-pointer border-b last:border-b-0 border-[#f1f5f9] flex items-center justify-between hover:bg-[#f8fafc] transition-colors ${isSelected ? 'bg-[#f0f9ff]' : ''}`}
                >
                  <div>
                    <span className={`font-medium ${isSelected ? 'text-[#0284c7]' : 'text-[#334155]'}`}>{opt.label}</span>
                    {opt.subLabel && <span className="ml-2 text-[11px] text-[#94a3b8]">{opt.subLabel}</span>}
                  </div>
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
