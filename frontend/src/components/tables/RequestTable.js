'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './RequestTable.module.css';

function SortIcon({ sortKey, col, sortDir }) {
  return (
    <span className={styles.sortIcon}>
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
    </span>
  );
}

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', cls: 'badge-info' },
  completed:   { label: 'Completed',   cls: 'badge-success' },
  delayed:     { label: 'Delayed',     cls: 'badge-warning' },
  critical:    { label: 'Critical',    cls: 'badge-critical' },
};

const SLA_CONFIG = {
  on_track:  { label: 'On Track',  cls: 'badge-success' },
  warning:   { label: 'Warning',   cls: 'badge-warning' },
  breached:  { label: 'Breached',  cls: 'badge-danger' },
  critical:  { label: 'Critical',  cls: 'badge-critical' },
  completed: { label: 'Done',      cls: 'badge-neutral' },
  unknown:   { label: '-',          cls: 'badge-neutral' },
};

const PRIORITY_CLS = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };

const STAGE_LABELS = {
  inquiry: 'Sales', engineering_review: 'Engineering',
  quotation: 'Quotation', dispatch: 'Dispatch', delivered: 'Delivered',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SLABar({ pct = 0 }) {
  const clamped = Math.min(pct, 200);
  const color = pct >= 150 ? 'var(--color-critical)' : pct >= 100 ? 'var(--color-danger)' : pct >= 75 ? 'var(--color-warning)' : 'var(--color-success)';
  return (
    <div className={styles.slaBar}>
      <div className={styles.slaTrack}>
        <div className={styles.slaFill} style={{ width: `${Math.min(clamped / 2, 100)}%`, background: color }} />
      </div>
      <span className={styles.slaPct} style={{ color }}>{Math.round(pct)}%</span>
    </div>
  );
}

export default function RequestTable({ data = [], onRefresh }) {
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...data].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('crm_reference')} className={styles.sortable}>
              Ref <SortIcon sortKey={sortKey} col="crm_reference" sortDir={sortDir} />
            </th>
            <th>Customer</th>
            <th onClick={() => handleSort('product_category')} className={styles.sortable}>
              Product <SortIcon sortKey={sortKey} col="product_category" sortDir={sortDir} />
            </th>
            <th onClick={() => handleSort('priority')} className={styles.sortable}>
              Priority <SortIcon sortKey={sortKey} col="priority" sortDir={sortDir} />
            </th>
            <th>Stage</th>
            <th onClick={() => handleSort('status')} className={styles.sortable}>
              Status <SortIcon sortKey={sortKey} col="status" sortDir={sortDir} />
            </th>
            <th>SLA Progress</th>
            <th onClick={() => handleSort('created_at')} className={styles.sortable}>
              Created <SortIcon sortKey={sortKey} col="created_at" sortDir={sortDir} />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(req => {
            const statusConf = STATUS_CONFIG[req.status] || { label: req.status, cls: 'badge-neutral' };
            const slaConf = SLA_CONFIG[req.sla_status] || SLA_CONFIG.unknown;
            const priCls = PRIORITY_CLS[req.priority] || '';
            return (
              <tr key={req.id} className={styles.row}>
                <td>
                  <div className={styles.refCell}>
                    <span className={styles.refCode}>{req.crm_reference || '-'}</span>
                    <span className={styles.refSub}>{req.erp_reference}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.customerCell}>
                    <span className={styles.customerName}>{req.customer?.name || '-'}</span>
                    <span className={styles.customerRegion}>{req.customer?.region}</span>
                  </div>
                </td>
                <td><span className={styles.product}>{req.product_category}</span></td>
                <td><span className={`badge ${priCls}`}>{req.priority}</span></td>
                <td><span className={styles.stage}>{STAGE_LABELS[req.current_stage] || req.current_stage}</span></td>
                <td><span className={`badge ${statusConf.cls}`}>{statusConf.label}</span></td>
                <td><SLABar pct={req.sla_percentage || 0} /></td>
                <td><span className={styles.date}>{formatDate(req.created_at)}</span></td>
                <td>
                  <Link href={`/request/${req.id}`} className={`btn btn-ghost ${styles.viewBtn}`}>
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className={styles.empty}>No requests found</div>
      )}
    </div>
  );
}
