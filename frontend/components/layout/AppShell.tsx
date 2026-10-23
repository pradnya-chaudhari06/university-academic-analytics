'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { ToastProvider } from '../common/Toast';
import { useAuth } from '../../lib/auth';
import { isRouteAuthorized, getRoleLandingRoute, getAuthorizedRolesForRoute } from '../../lib/rbac';

interface AppShellProps {
  children: React.ReactNode;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  selectedSemester?: string;
  onSemesterChange?: (sem: string) => void;
  selectedDepartment?: string;
  onDepartmentChange?: (dept: string) => void;
  activeItem?: string;
  onItemSelect?: (id: string) => void;
  onOpenSettings?: () => void;
}

export default function AppShell({
  children,
  selectedYear = 'AY 2025–26',
  onYearChange,
  selectedSemester = 'Semester VI',
  onSemesterChange,
  selectedDepartment = 'All Departments',
  onDepartmentChange,
  activeItem,
  onItemSelect,
  onOpenSettings,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Internal state fallback if parent page doesn't manage filters
  const [internalYear, setInternalYear] = useState(selectedYear);
  const [internalSem, setInternalSem] = useState(selectedSemester);
  const [internalDept, setInternalDept] = useState(selectedDepartment);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f5f7] text-[#1e2238] font-sans">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e2438] text-white font-bold text-sm shadow-sm ring-1 ring-white/10 animate-pulse">
            UA
          </div>
          <div className="text-xs font-semibold text-slate-700">UniAnalytics</div>
          <p className="text-[11px] text-slate-500">Connecting conformed academic session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Strict Role-Based Route Authorization Guard
  const isAuthorized = isRouteAuthorized(user.role, pathname, user.studentId);
  const landingRoute = getRoleLandingRoute(user.role, user.studentId);
  const permittedRoles = getAuthorizedRolesForRoute(pathname);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f4f5f7] text-[#1e2238] font-sans antialiased selection:bg-[#fff4ed] selection:text-[#f87941]">
        {/* Slim Left Sidebar with role-filtered navigation links */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          activeItem={activeItem}
          onItemSelect={onItemSelect}
        />

        {/* Central Content Area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Compact Top Header */}
          <TopHeader
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            selectedYear={selectedYear || internalYear}
            onYearChange={onYearChange || setInternalYear}
            selectedSemester={selectedSemester || internalSem}
            onSemesterChange={onSemesterChange || setInternalSem}
            selectedDepartment={selectedDepartment || internalDept}
            onDepartmentChange={onDepartmentChange || setInternalDept}
            onOpenSettings={onOpenSettings}
          />

          {/* Main Content Body */}
          <div className="flex-1 overflow-y-auto">
            {isAuthorized ? (
              children
            ) : (
              <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-lg rounded-xl border border-rose-200 bg-white p-7 shadow-sm text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600">
                    <ShieldAlert className="h-7 w-7" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block rounded-full bg-rose-50 border border-rose-200 px-3 py-0.5 text-[10px] font-bold tracking-wider text-rose-700 uppercase">
                      HTTP 403 Forbidden · RBAC Enforced
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-[#1e2238]">
                      Access Restricted
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Your active account role (<span className="font-semibold text-slate-800">{user.role}</span>) does not have authorization to access route <code className="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded font-mono text-[11px]">{pathname}</code>.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Attempted Route:</span>
                      <span className="font-mono font-semibold text-slate-800">{pathname}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Your Role:</span>
                      <span className="font-semibold text-rose-700">{user.role}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Authorized Roles:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[240px]">
                        {permittedRoles.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={landingRoute}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1e2438] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#2c334d] transition-colors shadow-2xs"
                    >
                      <span>Return to Authorized Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
