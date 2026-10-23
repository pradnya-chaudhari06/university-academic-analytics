'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, FileText, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { sampleNotifications } from '../../data/sampleAcademicData';
import { NotificationItem } from '../../types/academic';
import { useToast } from '../common/Toast';

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(sampleNotifications);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Notifications updated', 'All notifications marked as read.', 'info');
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'etl':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'report':
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'sync':
        return <RefreshCw className="h-4 w-4 text-violet-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="System notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-white" />
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-[#e5e7eb] bg-white shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8f9fa] px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-100 text-indigo-700 px-1.5 py-0.2 text-[10px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3.5 transition-colors ${
                  !item.read ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white shrink-0 shadow-2xs">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800 leading-snug">
                    {item.title}
                  </p>
                  <span className="mt-1 block text-[10px] text-slate-400 font-mono">
                    {item.timestamp}
                  </span>
                </div>

                {!item.read && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-center">
            <span className="text-[11px] text-slate-500">
              DWM Pipeline & Alert System (Demo Feed)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
