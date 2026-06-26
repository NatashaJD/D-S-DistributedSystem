'use client';
import { useState, useEffect, useCallback } from 'react';
import RequestTable from '../../components/tables/RequestTable';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiFetch } from '../../hooks/useAPI';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../lib/roleConfig';
import styles from './page.module.css';

const STATUSES   = ['', 'in_progress', 'completed', 'delayed', 'critical'];
const DEPTS      = ['', 'Sales', 'Engineering', 'Quotations', 'Logistics'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];
const REGIONS    = ['', 'Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru', 'Thika', 'Nyeri', 'Malindi'];

function ScopeTag({ label, type }) {
  const icon = type === 'department' ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    </svg>
  );
  return (
    <div className={styles.scopeTag}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const roleConfig = getRoleConfig(user?.role, user?.scope);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    department: roleConfig.defaultDeptFilter,
    priority: '',
    region: '',
    search: '',
  });
  const [total, setTotal] = useState(0);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const data = await apiFetch('/api/v1/requests', params);
      setRequests(data);
      setTotal(data.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useWebSocket((msg) => {
    if (msg.type === 'new_event' || msg.type === 'sla_alert') {
      fetchRequests();
    }
  });

  const breachCount   = requests.filter(r => r.sla_status === 'breached').length;
  const warningCount  = requests.filter(r => r.sla_status === 'warning').length;
  const criticalCount = requests.filter(r => r.sla_status === 'critical').length;

  const clearFilters = () => setFilters({
    status: '',
    department: roleConfig.defaultDeptFilter,
    priority: '',
    region: '',
    search: '',
  });

  const hasActiveFilters = filters.status || filters.priority || filters.region || filters.search ||
    filters.department !== roleConfig.defaultDeptFilter;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>Operations Center</h2>
          <p className={styles.subtitle}>Live request tracker: {total} requests loaded</p>
        </div>
        <div className={styles.headerActions}>
          {roleConfig.scopeType && (
            <ScopeTag label={roleConfig.scopeDisplay} type={roleConfig.scopeType} />
          )}
          <button className="btn btn-ghost" onClick={fetchRequests}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {(breachCount > 0 || criticalCount > 0) && (
        <div className={styles.alertBanner}>
          {criticalCount > 0 && (
            <div className={`${styles.alertChip} ${styles.alertCritical}`}>
              <span className={styles.alertDot} />
              {criticalCount} Critical Delays
            </div>
          )}
          {breachCount > 0 && (
            <div className={`${styles.alertChip} ${styles.alertBreached}`}>
              <span className={styles.alertDot} />
              {breachCount} SLA Breaches
            </div>
          )}
          {warningCount > 0 && (
            <div className={`${styles.alertChip} ${styles.alertWarning}`}>
              <span className={styles.alertDot} />
              {warningCount} Warnings
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className={`card ${styles.filterBar}`}>
        <input
          className={`input ${styles.searchInput}`}
          placeholder="Search customer, company, or CRM ref..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select className={`input ${styles.select}`} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className={`input ${styles.select}`} value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}>
          <option value="">All Departments</option>
          {DEPTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={`input ${styles.select}`} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {PRIORITIES.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={`input ${styles.select}`} value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}>
          <option value="">All Regions</option>
          {REGIONS.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {hasActiveFilters && (
          <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className={styles.loadingRow}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: 4 }} />
            ))}
          </div>
        ) : (
          <RequestTable data={requests} onRefresh={fetchRequests} />
        )}
      </div>
    </div>
  );
}
