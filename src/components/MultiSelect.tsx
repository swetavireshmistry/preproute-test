import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  label: string;
  placeholder: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  error?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  disabled = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== id));
  };

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.id));

  return (
    <div className="flex flex-col" ref={containerRef}>
      <label className="mb-2 block text-[16px] font-medium leading-[150%] tracking-normal text-[#374151]">
        {label}
      </label>
      <div className="relative">
        <div
          onClick={handleToggle}
          className={`flex min-h-12 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-[10px] border bg-white px-4 py-2 text-sm transition-all ${
            disabled
              ? 'cursor-not-allowed border-[#E5E7EB] bg-[#F8FAFC] text-[#D1D5DB]'
              : error
              ? 'border-red-300'
              : isOpen
              ? 'border-[#3D4FCB]'
              : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
          }`}
        >
          {selectedOptions.length === 0 ? (
            <span className="select-none placeholder-text">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.id}
                  className="inline-flex items-center gap-1 rounded-md border border-[#E0E7FF] bg-[#F5F7FF] px-2.5 py-0.5 text-xs font-medium text-[#384EC7]"
                >
                  {opt.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(opt.id, e)}
                      className="cursor-pointer rounded p-0.5 text-[#384EC7] hover:bg-[#E0E7FF]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center pl-2 text-[#9CA3AF]">
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1.5 flex max-h-60 w-full flex-col overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-xl shadow-slate-200/50">
            <div className="border-b border-[#EEF2F7] bg-[#F8FAFC] p-2">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-base font-medium leading-[150%] tracking-normal text-[#374151] focus:border-[#3D4FCB] focus:outline-none"
              />
            </div>

            <div className="flex-1 divide-y divide-[#F8FAFC] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-xs font-medium text-[#9CA3AF]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedValues.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      className={`flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? 'bg-[#F5F7FF] font-medium text-[#384EC7]'
                          : 'text-[#374151] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span>{opt.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-[#384EC7]" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};
