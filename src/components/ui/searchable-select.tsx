"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  placeholder?: string;
}

export function SearchableSelect({ value, onChange, options, label, placeholder }: SearchableSelectProps) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="w-full relative">
      <div className="relative" onClick={() => setOpen(true)}>
        <Input
          label={label}
          value={search}
          onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Buscar..."}
        />
        <Search size={16} className="absolute right-3 top-[38px] text-muted pointer-events-none" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-surface border border-border rounded-lg shadow-lg">
          {filtered.slice(0, 50).map((opt) => (
            <button
              key={opt}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors cursor-pointer ${
                opt === value ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              onClick={() => { onChange(opt); setSearch(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
          {filtered.length > 50 && (
            <div className="px-3 py-2 text-xs text-muted text-center">
              +{filtered.length - 50} resultados. Continue digitando...
            </div>
          )}
        </div>
      )}
      {open && search && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 p-3 bg-surface border border-border rounded-lg shadow-lg text-sm text-muted">
          Nenhuma hunt encontrada. Use o nome digitado.
        </div>
      )}
    </div>
  );
}
