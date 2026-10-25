'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Building2,
  BookOpen,
  Database,
  BarChart3,
  Brain,
  AlertTriangle,
  FileText,
  Settings,
  Shield,
  Layers,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  GraduationCap,
  Clock,
  Award,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { isRouteAuthorized, getRoleLandingRoute } from '../../lib/rbac';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeItem?: string;
  onItemSelect?: (id: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'live' | 'warning';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  // Baseline navigation catalog
  const allSections: NavSection[] = [
    {
      title: 'ACADEMIC',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'students',
          label: 'Students',
          href: '/students',
          icon: Users,
          badge: '4.8k',
        },
        {
          id: 'departments',
          label: 'Departments',
          href: '/departments',
          icon: Building2,
          badge: '5',
        },
        {
          id: 'courses',
          label: 'Courses',
          href: '/courses',
          icon: BookOpen,
          badge: '30',
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        {
          id: 'academic-performance',
          label: 'Academic Performance',
          href: '/analytics',
          icon: TrendingUp,
        },
        {
          id: 'olap-analysis',
          label: 'OLAP Analysis',
          href: '/analytics/olap',
          icon: BarChart3,
          badge: 'Cube',
        },
        {
          id: 'data-mining',
          label: 'Data Mining',
          href: '/analytics/data-mining',
          icon: Brain,
          badge: 'ML',
        },
        {
          id: 'at-risk-students',
          label: 'At-Risk Students',
          href: '/at-risk',
          icon: AlertTriangle,
          badge: '108',
          badgeVariant: 'warning',
        },
      ],
    },
    {
      title: 'DATA WAREHOUSE',
      items: [
        {
          id: 'data-warehouse',
          label: 'Warehouse Overview',
          href: '/warehouse',
          icon: Database,
          badge: 'Live',
          badgeVariant: 'live',
        },
        {
          id: 'etl-pipeline',
          label: 'ETL Pipeline',
          href: '/warehouse/etl',
          icon: Layers,
          badge: 'Audit',
        },
      ],
    },
    {
      title: 'REPORTING',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          href: '/reports',
          icon: FileText,
          badge: '5',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          href: '/settings',
          icon: Settings,
        },
        {
          id: 'profile',
          label: 'Profile',
          href: '/profile',
          icon: Shield,
        },
      ],
    },
  ];

  // Role-specific navigation filtering
  let visibleSections: NavSection[] = [];

  if (user?.role === 'Student') {
    visibleSections = [
      {
        title: 'MY ACADEMICS',
        items: [
          {
            id: 'student-dashboard',
            label: 'Academic Dashboard',
            href: '/student',
            icon: LayoutDashboard,
            badge: user.studentId || 'STU1178',
          },
          {
            id: 'courses',
            label: 'My Courses & Subjects',
            href: '/courses',
            icon: BookOpen,
          },
          {
            id: 'at-risk',
            label: 'Attendance & Risk',
            href: '/at-risk',
            icon: AlertTriangle,
          },
          {
            id: 'profile',
            label: 'Identity & Access',
            href: '/profile',
            icon: Shield,
          },
        ],
      },
    ];
  } else if (user?.role === 'Faculty') {
    visibleSections = [
      {
        title: 'MY TEACHING',
        items: [
          {
            id: 'faculty-dashboard',
            label: 'Faculty Dashboard',
            href: '/faculty',
            icon: LayoutDashboard,
            badge: 'Live',
            badgeVariant: 'live',
          },
          {
            id: 'faculty-courses',
            label: 'My Courses',
            href: '/courses',
            icon: BookOpen,
            badge: '4',
          },
          {
            id: 'faculty-students',
            label: 'Students',
            href: '/students',
            icon: Users,
            badge: 'CE',
          },
          {
            id: 'faculty-performance',
            label: 'Class Performance',
            href: '/faculty/performance',
            icon: TrendingUp,
          },
          {
            id: 'faculty-at-risk',
            label: 'At-Risk Students',
            href: '/at-risk',
            icon: AlertTriangle,
            badge: '22',
            badgeVariant: 'warning',
          },
        ],
      },
      {
        title: 'ANALYSIS',
        items: [
          {
            id: 'performance-analysis',
            label: 'Performance Analysis',
            href: '/faculty/performance',
            icon: BarChart3,
          },
          {
            id: 'attendance-analysis',
            label: 'Attendance Analysis',
            href: '/faculty/attendance',
            icon: Clock,
          },
          {
            id: 'assessment-analysis',
            label: 'Assessment Analysis',
            href: '/faculty/performance',
            icon: Award,
          },
          {
            id: 'faculty-insights',
            label: 'Class Insights',
            href: '/faculty/insights',
            icon: Brain,
            badge: 'ML',
          },
        ],
      },
      {
        title: 'ACCOUNT',
        items: [
          {
            id: 'profile',
            label: 'Profile',
            href: '/profile',
            icon: Shield,
          },
        ],
      },
    ];
  } else if (user?.role === 'Analyst' || user?.role === 'Analytics') {
    visibleSections = [
      {
        title: 'ANALYTICAL OPERATIONS',
        items: [
          {
            id: 'dashboard',
            label: 'Overview',
            href: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            id: 'academic-performance',
            label: 'Academic Performance',
            href: '/analytics',
            icon: TrendingUp,
          },
          {
            id: 'olap-analysis',
            label: 'OLAP Analysis',
            href: '/analytics/olap',
            icon: BarChart3,
            badge: 'Cube',
          },
          {
            id: 'data-mining',
            label: 'Data Mining Studio',
            href: '/analytics/data-mining',
            icon: Brain,
            badge: 'ML',
          },
          {
            id: 'at-risk-students',
            label: 'At-Risk Analysis',
            href: '/at-risk',
            icon: AlertTriangle,
            badge: '108',
            badgeVariant: 'warning',
          },
        ],
      },
      {
        title: 'DATA & SYSTEM',
        items: [
          {
            id: 'data-warehouse',
            label: 'Warehouse Schema',
            href: '/warehouse',
            icon: Database,
            badge: 'Live',
            badgeVariant: 'live',
          },
          {
            id: 'etl-pipeline',
            label: 'ETL Pipeline',
            href: '/warehouse/etl',
            icon: Layers,
            badge: 'Audit',
          },
          {
            id: 'reports',
            label: 'Analytical Reports',
            href: '/reports',
            icon: FileText,
            badge: '5',
          },
          {
            id: 'settings',
            label: 'Settings',
            href: '/settings',
            icon: Settings,
          },
        ],
      },
    ];
  } else {
    // Administrator / Leadership Role (Dean, Academic Coordinator, Principal, HOD)
    // 9 clean, non-technical responsibility-based navigation items
    visibleSections = [
      {
        title: 'ACADEMIC MANAGEMENT',
        items: [
          {
            id: 'dashboard',
            label: 'Overview',
            href: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            id: 'academic-performance',
            label: 'Academic Performance',
            href: '/analytics',
            icon: TrendingUp,
          },
          {
            id: 'students',
            label: 'Students',
            href: '/students',
            icon: Users,
            badge: '4.8k',
          },
          {
            id: 'departments',
            label: 'Departments',
            href: '/departments',
            icon: Building2,
            badge: '5',
          },
          {
            id: 'courses',
            label: 'Courses',
            href: '/courses',
            icon: BookOpen,
            badge: '30',
          },
          {
            id: 'student-support',
            label: 'Student Support',
            href: '/at-risk',
            icon: AlertTriangle,
            badge: '108',
            badgeVariant: 'warning',
          },
          {
            id: 'reports',
            label: 'Reports',
            href: '/reports',
            icon: FileText,
          },
          {
            id: 'data-management',
            label: 'Data Management',
            href: '/warehouse',
            icon: Database,
            badge: 'Verified',
            badgeVariant: 'live',
          },
          {
            id: 'settings',
            label: 'Settings',
            href: '/settings',
            icon: Settings,
          },
        ],
      },
    ];
  }

  const landingRoute = getRoleLandingRoute(user?.role, user?.studentId);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Slim Fixed Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r border-[#e7eaee] bg-white transition-all duration-200 lg:static ${
          isCollapsed ? 'w-[64px]' : 'w-[215px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-13 items-center justify-between border-b border-[#e7eaee] px-3.5 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="h-4 w-4" />
            </button>

            {!isCollapsed && (
              <Link href={landingRoute} className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold tracking-tight text-[#1e2238] text-[14px] truncate">
                  Uni<span className="text-[#f87941]">Analytics</span>
                </span>
              </Link>
            )}
          </div>

          {/* Desktop Collapse Icon */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3">
          {visibleSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <div className="px-2 pb-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : item.href === '/faculty'
                      ? pathname === '/faculty'
                      : item.href === '/student'
                      ? pathname === '/student' || (user?.role === 'Student' && pathname.startsWith('/students/'))
                      : !item.href.includes('#') && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));

                  return (
                    <li key={item.id} className="relative">
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        title={isCollapsed ? item.label : undefined}
                        className={`group relative flex w-full items-center rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                          isCollapsed ? 'justify-center rounded-md' : 'justify-between'
                        } ${
                          isActive
                            ? 'bg-[#fff5ee] text-[#1e2238] font-semibold border-l-2 border-[#f87941]'
                            : 'text-slate-600 hover:bg-[#f7f8fa] hover:text-[#1e2238] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#f87941]'
                                : 'text-slate-400 group-hover:text-slate-700'
                            }`}
                          />
                          {!isCollapsed && (
                            <span className="truncate text-[11.5px]">{item.label}</span>
                          )}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-medium ${
                              isActive
                                ? 'bg-white text-[#f87941] border border-[#fcd5bf]'
                                : item.badgeVariant === 'live'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.badgeVariant === 'warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-[#f4f5f7] text-slate-500'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Quick Sign Out Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                logout();
              }}
              title={isCollapsed ? 'Sign Out' : undefined}
              className={`group flex w-full items-center rounded-md px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'gap-2'
              }`}
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              {!isCollapsed && <span className="text-[11.5px] font-medium">Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Status Pill at Sidebar Bottom */}
        {!isCollapsed ? (
          <div className="border-t border-[#e7eaee] p-3 bg-[#fafbfd]">
            <div className="rounded-lg border border-[#e7eaee] bg-white p-2.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-700">
                  {user?.role === 'Student' ? 'Student Session' : 'DWM Star Schema'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[8px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 truncate">
                {user?.role === 'Student'
                  ? `ID: ${user.studentId || 'STU1178'}`
                  : user?.role === 'Faculty'
                  ? 'Dept: Computer Eng'
                  : user?.role === 'Analyst' || user?.role === 'Analytics'
                  ? 'Institutional Analytics'
                  : 'FactAcademicPerformance'}
              </p>
            </div>
          </div>
        ) : (
          <div className="border-t border-[#e7eaee] p-2.5 text-center">
            <div
              className="h-2 w-2 mx-auto rounded-full bg-emerald-500"
              title="Session: Active"
            />
          </div>
        )}
      </aside>
    </>
  );
}
