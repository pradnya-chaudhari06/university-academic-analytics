'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, BookOpen, Building2, FileText, ArrowRight } from 'lucide-react';
import { sampleSearchData } from '../../data/sampleAcademicData';
import { GlobalSearchResult } from '../../types/academic';
import { useToast } from '../common/Toast';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', 'Students', 'Courses', 'Departments', 'Reports'];

  const filteredResults = sampleSearchData.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.meta.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const getCategoryIcon = (category: GlobalSearchResult['category']) => {
    switch (category) {
      case 'Students':
        return <Users className="h-4 w-4 text-indigo-600" />;
      case 'Courses':
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      case 'Departments':
        return <Building2 className="h-4 w-4 text-violet-600" />;
      case 'Reports':
        return <FileText className="h-4 w-4 text-amber-600" />;
      default:
        return <Search className="h-4 w-4 text-slate-500" />;
    }
  };

  const handleSelectResult = (item: GlobalSearchResult) => {
    showToast(
      `Selected ${item.title}`,
      `${item.category} record: ${item.subtitle} (Demo mode).`,
      'info'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Modal Card */}
      <div className="relative w-full max-w-xl rounded-xl border border-[#e5e7eb] bg-white shadow-2xl z-10 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, courses, departments..."
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="hidden sm:inline-block rounded border border-[#e5e7eb] bg-[#f8f9fa] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-[#f8f9fa] overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectResult(item)}
                className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white shrink-0 shadow-2xs">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[11px] font-mono text-slate-600 bg-[#f8f9fa] px-2 py-0.5 rounded border border-[#e5e7eb]">
                    {item.meta}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching {activeCategory !== 'All' ? activeCategory.toLowerCase() : 'records'} found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-4 py-2 text-[11px] text-slate-500">
          <span>Search scope: DimStudent, DimCourse, DimDepartment</span>
          <span className="font-mono">Demo Dataset</span>
        </div>
      </div>
    </div>
  );
}
