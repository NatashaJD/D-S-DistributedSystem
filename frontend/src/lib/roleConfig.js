/**
 * Role-based access configuration — Davis & Shirtliff 1000 Eyes.
 * Defines: home route, visible nav paths, default operations filter, scope label.
 */
export const ROLE_CONFIG = {
  executive: {
    home: '/',
    navPaths: ['/', '/operations', '/analytics', '/copilot'],
    defaultDeptFilter: '',
    scopeLabel: 'Full Access',
    scopeType: null,
  },
  ops_manager: {
    home: '/',
    navPaths: ['/', '/operations', '/analytics', '/copilot'],
    defaultDeptFilter: '',
    scopeLabel: 'Full Access',
    scopeType: null,
  },
  regional_manager: {
    home: '/operations',
    navPaths: ['/operations', '/analytics', '/copilot'],
    defaultDeptFilter: '',
    scopeLabel: 'Regional Operations',
    scopeType: 'region',
  },
  sales_engineer: {
    home: '/operations',
    navPaths: ['/operations', '/analytics', '/copilot'],
    defaultDeptFilter: 'Sales',
    scopeLabel: 'Sales Department',
    scopeType: 'department',
  },
  engineering_officer: {
    home: '/operations',
    navPaths: ['/operations', '/analytics', '/copilot'],
    defaultDeptFilter: 'Engineering',
    scopeLabel: 'Engineering Department',
    scopeType: 'department',
  },
  logistics_officer: {
    home: '/operations',
    navPaths: ['/operations', '/analytics', '/copilot'],
    defaultDeptFilter: 'Logistics',
    scopeLabel: 'Logistics Department',
    scopeType: 'department',
  },
  aftersales_officer: {
    home: '/operations',
    navPaths: ['/operations', '/analytics', '/copilot'],
    defaultDeptFilter: 'After Sales',
    scopeLabel: 'After Sales Department',
    scopeType: 'department',
  },
  finance_officer: {
    home: '/operations',
    navPaths: ['/operations', '/analytics', '/copilot'],
    defaultDeptFilter: 'Finance',
    scopeLabel: 'Finance Department',
    scopeType: 'department',
  },
};

export function getRoleConfig(role, scope) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.executive;
  return {
    ...cfg,
    scopeDisplay: scope && scope !== 'all' ? scope : cfg.scopeLabel,
    canAccess: (path) => {
      if (path.startsWith('/request/')) return true;
      return cfg.navPaths.some(p => path === p || (p !== '/' && path.startsWith(p)));
    },
  };
}
