import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck, IconX } from '@tabler/icons-react';
import { Badge } from './ui/badge';

export default function SearchableMultiSelect({ options, selected, onChange, placeholder = "Select...", disabled, error, renderOption }) {
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

  const displayOption = (opt) => renderOption ? renderOption(opt) : opt;

  const filteredOptions = options.filter(opt => {
    const label = displayOption(opt);
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(item => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const removeOption = (e, opt) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== opt));
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={`flex min-h-[40px] w-full items-center justify-between gap-1.5 rounded-lg border bg-background/50 py-1.5 px-3 text-sm transition-colors outline-none focus-within:ring-2 focus-within:ring-ring/50 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'} ${error ? 'border-red-500' : 'border-input'}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 items-center">
          {selected.length > 0 && selected.map(opt => (
            <Badge key={opt} variant="secondary" className="gap-1 px-1.5 py-0.5 text-xs font-medium rounded-md flex items-center">
              {displayOption(opt)}
              <button
                type="button"
                onClick={(e) => removeOption(e, opt)}
                className="rounded-full hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground p-0.5 transition-colors cursor-pointer"
              >
                <IconX className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none min-w-[100px] text-sm py-0.5 text-foreground placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => {
               setSearch(e.target.value);
               if (!isOpen) setIsOpen(true);
            }}
            placeholder={selected.length === 0 ? placeholder : ''}
            disabled={disabled}
            onFocus={() => setIsOpen(true)}
          />
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="shrink-0 p-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <IconChevronDown className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 w-full mt-1 bg-popover border border-border/80 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <li
                    key={opt}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt);
                      // Keep it open to allow multiple selections, but reset search
                      setSearch('');
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-popover-foreground'}`}
                  >
                    {displayOption(opt)}
                    {isSelected && <IconCheck className="w-4 h-4 text-primary" />}
                  </li>
                );
              })
            ) : (
              <li className="px-2 py-3 text-sm text-center text-muted-foreground">No results found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
