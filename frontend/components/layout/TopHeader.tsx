'use client';

import React, { useState } from 'react';
import { Search, Menu, Calendar, ChevronDown, Mail } from 'lucide-react';
import NotificationMenu from './NotificationMenu';
import ProfileMenu from './ProfileMenu';
import GlobalSearch from './GlobalSearch';
import { useToast } from '../common/Toast';

import { useAuth } from '../../lib/auth';

interface TopHeaderProps {
  onMenuToggle: () => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedSemester: string;
  onSemesterChange: (sem: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  onOpenSettings?: () => void;
}

export default function TopHeader({
  onMenuToggle,
  selectedYear,
  onYearChange,
  selectedSemester,
  onSemesterChange,
  selectedDepartment,
  onDepartmentChange,
  onOpenSettings,
}: TopHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const handleDepartmentSelect = (dept: string) => {
    onDepartmentChange(dept);
    showToast('Department Filter', `Context updated to ${dept}.`, 'info');
  };

  const handleDateClick = () => {
    showToast('Academic Date Range', 'Temporal window: AY 2025–26 (01 Jul 2025 - 30 Jun 2026)', 'info');
  };

  const handleMailClick = () => {
    showToast(
      'Academic Messages',
      'Faculty messaging is not connected to a backend service in this build.',
      'info'
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-13 sm:h-14 w-full items-center justify-between border-b border-[#e7eaee] bg-white px-3.5 sm:px-5">
        {/* Left: Mobile Toggle & Greeting Context */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e7eaee] bg-[#f7f8fa] text-slate-600 hover:text-slate-900 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[14px] sm:text-[15px] font-bold tracking-tight text-[#1e2238] leading-tight">
                Good Morning, <span className="font-semibold text-slate-700">{user?.name || 'Academic Leader'}</span>
              </h1>
              {user?.role && (
                <span className={`hidden sm:inline-flex items-center rounded-md border px-2 py-0.5 text-[9.5px] font-bold tracking-wide uppercase ${
                  user.role === 'Student'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : user.role === 'Faculty'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : user.role === 'Analyst' || user.role === 'Analytics'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}>
                  {user.role}
                </span>
              )}
            </div>
            <p className="text-[10.5px] font-normal text-slate-500 leading-tight mt-0.5">
              {user?.role === 'Student'
                ? `Personal Academic Record · Semester VI (${selectedYear})`
                : user?.role === 'Faculty'
                ? `Department Performance Summary · Semester VI (${selectedYear})`
                : user?.role === 'Analyst' || user?.role === 'Analytics'
                ? `Institutional Analytics & Knowledge Discovery · AY 2025–26`
                : `Academic Performance Summary · Semester VI (${selectedYear})`}
            </p>
          </div>
        </div>

        {/* Right: Category Dropdown, Date Range, Search, Mail, Bell, Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Category / Department Dropdown matching reference (hidden for Student) */}
          {user?.role !== 'Student' && (
            <div className="relative hidden md:block">
              <div className="flex items-center rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-slate-300 transition-colors">
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentSelect(e.target.value)}
                  aria-label="Filter Department"
                  className="bg-transparent text-[11.5px] font-medium text-slate-700 focus:outline-hidden cursor-pointer pr-4 appearance-none"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          )}

          {/* Date Range Selector matching reference */}
          <button
            type="button"
            onClick={handleDateClick}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors cursor-pointer"
            title="Date Range Window"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-600">01 Jul 2025 - 30 Jun 2026</span>
          </button>

          {/* Search Trigger Icon (restricted for students to enforce institutional privacy) */}
          {user?.role !== 'Student' && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Search (⌘K)"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Messages / Mail Icon */}
          <button
            type="button"
            onClick={handleMailClick}
            className="hidden sm:flex h-7.5 w-7.5 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Messages"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>

          {/* Notifications Menu with red badge */}
          <NotificationMenu />

          {/* User Profile Avatar */}
          <ProfileMenu onOpenSettings={onOpenSettings} />
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

