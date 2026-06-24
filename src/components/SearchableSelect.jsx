import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';

export default function SearchableSelect({ options, value, onChange, placeholder, disabled, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch(''); // reset search on close
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-1.5 rounded-lg border bg-background/50 py-2 px-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${!value ? 'text-muted-foreground' : 'text-foreground'} ${error ? 'border-red-500' : 'border-input'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <IconChevronDown className="w-4 h-4 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 w-full mt-1 bg-popover border border-border/80 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-2 border-b border-border/40">
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search..." 
              className="h-8 text-xs bg-background/50"
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground ${value === opt ? 'bg-accent/50 text-accent-foreground' : 'text-popover-foreground'}`}
                >
                  {opt}
                  {value === opt && <IconCheck className="w-4 h-4" />}
                </li>
              ))
            ) : (
              <li className="px-2 py-3 text-sm text-center text-muted-foreground">No results found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
