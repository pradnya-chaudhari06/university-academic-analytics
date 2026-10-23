'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useAuth } from '../../lib/auth';

interface ProfileMenuProps {
  onOpenSettings?: () => void;
}

export default function ProfileMenu({ onOpenSettings }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    setIsOpen(false);
    showToast('Session Ended', 'Institutional user session securely closed.', 'info');
    logout();
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const canAccessSettings =
    user?.role === 'System Administrator' || user?.role === 'Administrator';

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#f87941]/30 transition-all cursor-pointer"
        title={`${user?.name || 'User'} Profile`}
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2438] text-white overflow-hidden ring-1 ring-[#e7eaee]">
          <span className="font-semibold text-xs text-white">
            {user?.avatarInitials || 'JD'}
          </span>
          {/* Subtle online status indicator */}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
        </div>
      </button>

      {/* Profile Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[#e5e7eb] bg-white shadow-xl z-50 overflow-hidden">
          {/* Header Card */}
          <div className="border-b border-[#e5e7eb] bg-[#f8f9fa] p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || 'Academic User'}
              </p>
              <span className="inline-flex items-center rounded border border-[#fcd5bf] bg-[#fff4ed] px-1.5 py-0.2 text-[9px] font-bold text-[#f87941]">
                {user?.role || 'User'}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
              {user?.email || 'user@university.edu'}
            </p>
            <p className="text-[10px] text-indigo-700 font-medium truncate mt-1 bg-indigo-50/70 border border-indigo-100 rounded px-1.5 py-0.5">
              {user?.designation || 'Academic Staff'}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-[#f7f7f5] transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>User Profile & Access</span>
            </button>

            {canAccessSettings && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenSettings) onOpenSettings();
                  else handleNavigate('/settings');
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-[#f7f7f5] transition-colors cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                <span>System Settings</span>
              </button>
            )}

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
              <span className="font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
