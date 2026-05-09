"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function NavMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-all duration-300 hover:bg-[var(--surface-strong)] hover:text-[var(--heading)]"
      >
        Menu
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl backdrop-blur-md">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--heading)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
