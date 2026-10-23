/**
 * Role-Based Access Control (RBAC) System
 * University Academic Performance Data Warehouse & Mining System
 *
 * Enforces strict role-based access control where each account has one fixed role
 * and permissions are strictly enforced across all application routes.
 */

export type UserRole =
  | 'System Administrator'
  | 'Academic Administrator'
  | 'HOD'
  | 'Faculty'
  | 'Student'
  | 'Administrator' // Legacy alias for backward compatibility
  | 'Analyst'       // Legacy alias for backward compatibility
  | 'Analytics';     // Conformed alias

export interface RoleConfig {
  role: UserRole;
  title: string;
  description: string;
  defaultLandingRoute: string;
  allowedPrefixes: string[];
}

/**
 * Route authorization matrix mapping route patterns to permitted roles.
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['System Administrator', 'Academic Administrator', 'HOD', 'Administrator'],
  '/faculty': ['Faculty', 'System Administrator', 'Academic Administrator', 'HOD', 'Administrator'],
  '/faculty/performance': ['Faculty', 'System Administrator', 'Academic Administrator', 'HOD', 'Administrator'],
  '/faculty/attendance': ['Faculty', 'System Administrator', 'Academic Administrator', 'HOD', 'Administrator'],
  '/faculty/insights': ['Faculty', 'System Administrator', 'Academic Administrator', 'HOD', 'Administrator'],
  '/faculty/student': ['Faculty', 'System Administrator', 'Academic Administrator', 'HOD', 'Administrator'],
  '/student': ['Student', 'System Administrator', 'Academic Administrator', 'HOD', 'Faculty', 'Administrator', 'Analyst', 'Analytics'],
  '/students': ['System Administrator', 'Academic Administrator', 'HOD', 'Faculty', 'Administrator', 'Analyst', 'Analytics'],
  '/departments': ['System Administrator', 'Academic Administrator', 'HOD', 'Administrator', 'Analyst', 'Analytics'],
  '/courses': ['Student', 'System Administrator', 'Academic Administrator', 'HOD', 'Faculty', 'Administrator', 'Analyst', 'Analytics'],
  '/at-risk': ['Student', 'System Administrator', 'Academic Administrator', 'HOD', 'Faculty', 'Administrator', 'Analyst', 'Analytics'],
  '/analytics': ['System Administrator', 'Academic Administrator', 'HOD', 'Administrator', 'Analyst', 'Analytics'],
  '/analytics/olap': ['System Administrator', 'Academic Administrator', 'HOD', 'Administrator', 'Analyst', 'Analytics'],
  '/analytics/data-mining': ['System Administrator', 'Academic Administrator', 'Administrator', 'Analyst', 'Analytics'],
  '/warehouse': ['System Administrator', 'Academic Administrator', 'Administrator'],
  '/warehouse/etl': ['System Administrator', 'Academic Administrator', 'Administrator'],
  '/reports': ['System Administrator', 'Academic Administrator', 'HOD', 'Administrator', 'Analyst', 'Analytics'],
  '/settings': ['System Administrator', 'Academic Administrator', 'Administrator'],
  '/profile': ['System Administrator', 'Academic Administrator', 'HOD', 'Faculty', 'Student', 'Administrator', 'Analyst', 'Analytics'],
};

/**
 * Returns the appropriate landing page for a given role.
 */
export function getRoleLandingRoute(role?: UserRole | null, studentId?: string): string {
  if (!role) return '/login';

  switch (role) {
    case 'Student':
      return '/student';
    case 'Faculty':
      return '/faculty';
    case 'Analyst':
    case 'Analytics':
      return '/analytics/olap';
    case 'System Administrator':
    case 'Academic Administrator':
    case 'HOD':
    case 'Administrator':
    default:
      return '/dashboard';
  }
}

/**
 * Evaluates whether a role is authorized to access a given pathname.
 *
 * Special Rules:
 * 1. Public route /login is always permitted.
 * 2. Profile /profile is permitted to all authenticated roles.
 * 3. Student role is permitted for /student, personal /courses, personal /at-risk, and own /students/[studentId] record.
 *    Any access by Student to the general /students directory, another student's record, /dashboard, or /warehouse is blocked.
 * 4. All subpaths (e.g. /departments/CE or /courses/CS601) inherit the parent route's authorization.
 */
export function isRouteAuthorized(
  role?: UserRole | null,
  pathname: string = '',
  studentId?: string
): boolean {
  if (!role) return false;

  // Clean trailing slashes except root
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (cleanPath === '/login') return true;
  if (cleanPath === '/profile') return true;

  // Student granular route restrictions
  if (role === 'Student') {
    if (cleanPath === '/student' || cleanPath.startsWith('/student/')) {
      return true;
    }
    if (cleanPath === '/courses' || cleanPath.startsWith('/courses/')) {
      return true;
    }
    if (cleanPath === '/at-risk' || cleanPath.startsWith('/at-risk/')) {
      return true;
    }
    const studentTarget = (studentId || 'STU1178').toUpperCase();
    if (cleanPath.startsWith('/students/')) {
      const targetId = cleanPath.split('/students/')[1]?.split('/')[0]?.toUpperCase();
      return targetId === studentTarget;
    }
    // Blocked from general /students, /dashboard, /departments, /warehouse, /analytics, /reports, /settings, etc.
    return false;
  }

  // Exact match check
  if (ROUTE_PERMISSIONS[cleanPath]) {
    return ROUTE_PERMISSIONS[cleanPath].includes(role);
  }

  // Subpath prefix checks
  if (cleanPath.startsWith('/warehouse/etl')) {
    return ROUTE_PERMISSIONS['/warehouse/etl']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/warehouse')) {
    return ROUTE_PERMISSIONS['/warehouse']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/analytics/olap')) {
    return ROUTE_PERMISSIONS['/analytics/olap']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/analytics/data-mining')) {
    return ROUTE_PERMISSIONS['/analytics/data-mining']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/analytics')) {
    return ROUTE_PERMISSIONS['/analytics']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/students/')) {
    // Individual student detail view: Faculty, HOD, Admins are permitted
    return ROUTE_PERMISSIONS['/students']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/students')) {
    return ROUTE_PERMISSIONS['/students']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/departments')) {
    return ROUTE_PERMISSIONS['/departments']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/courses')) {
    return ROUTE_PERMISSIONS['/courses']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/at-risk')) {
    return ROUTE_PERMISSIONS['/at-risk']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/reports')) {
    return ROUTE_PERMISSIONS['/reports']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/settings')) {
    return ROUTE_PERMISSIONS['/settings']?.includes(role) ?? false;
  }
  if (cleanPath.startsWith('/faculty')) {
    return ROUTE_PERMISSIONS['/faculty']?.includes(role) ?? false;
  }

  return false;
}

/**
 * Returns the human-readable list of roles authorized for a given route.
 */
export function getAuthorizedRolesForRoute(pathname: string): UserRole[] {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (ROUTE_PERMISSIONS[cleanPath]) {
    return ROUTE_PERMISSIONS[cleanPath];
  }
  if (cleanPath.startsWith('/faculty')) return ROUTE_PERMISSIONS['/faculty'];
  if (cleanPath.startsWith('/warehouse/etl')) return ROUTE_PERMISSIONS['/warehouse/etl'];
  if (cleanPath.startsWith('/warehouse')) return ROUTE_PERMISSIONS['/warehouse'];
  if (cleanPath.startsWith('/analytics/olap')) return ROUTE_PERMISSIONS['/analytics/olap'];
  if (cleanPath.startsWith('/analytics/data-mining')) return ROUTE_PERMISSIONS['/analytics/data-mining'];
  if (cleanPath.startsWith('/analytics')) return ROUTE_PERMISSIONS['/analytics'];
  if (cleanPath.startsWith('/students')) return ROUTE_PERMISSIONS['/students'];
  if (cleanPath.startsWith('/departments')) return ROUTE_PERMISSIONS['/departments'];
  if (cleanPath.startsWith('/courses')) return ROUTE_PERMISSIONS['/courses'];
  if (cleanPath.startsWith('/at-risk')) return ROUTE_PERMISSIONS['/at-risk'];
  if (cleanPath.startsWith('/reports')) return ROUTE_PERMISSIONS['/reports'];
  if (cleanPath.startsWith('/settings')) return ROUTE_PERMISSIONS['/settings'];

  return ['System Administrator'];
}
