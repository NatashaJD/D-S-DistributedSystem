'use client';
import { use } from 'react';
import Link from 'next/link';
import { useAPI } from '../../../hooks/useAPI';
import SwimlaneTimeline from '../../../components/timeline/SwimlaneTimeline';
import SLAGauge from '../../../components/charts/SLAGauge';
import styles from './page.module.css';

const PRIORITY_CLS = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };
const STATUS_CLS   = { in_progress: 'badge-info', completed: 'badge-success', delayed: 'badge-warning', critical: 'badge-critical' };
const STAGE_LABELS = { inquiry: 'Sales Inquiry', engineering_review: 'Engineering Review', quotation: 'Quotation & Approval', dispatch: 'Dispatch & Delivery', delivered: 'Delivered' };

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EventLog({ events = [] }) {
  const sorted = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return (
    <div className={styles.eventLog}>
      {sorted.map((ev, i) => (
        <div key={ev.id || i} className={styles.eventRow}>
          <div className={styles.eventDot} />
          <div className={styles.eventBody}>
            <div className={styles.eventHeader}>
              <span className={styles.eventType}>{ev.event_type?.replace(/_/g, ' ')}</span>
              <span className={styles.eventSrc}>{ev.source_system}</span>
              <span className={styles.eventTime}>{formatDate(ev.timestamp)}</span>
            </div>
            {ev.description && <div className={styles.eventDesc}>{ev.description}</div>}
            {ev.actor && <div className={styles.eventActor}>👤 {ev.actor}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RequestDetailPage({ params }) {
  const { id } = use(params);
  const { data: req, loading } = useAPI(`/api/v1/requests/${id}`);
  const { data: journey, loading: journeyLoading } = useAPI(`/api/v1/requests/${id}/journey`);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
      </div>
    );
  }

  if (!req) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h3>Request not found</h3>
        <Link href="/operations" className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to Operations</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/operations" className={styles.backLink}>← Operations</Link>
        <span>/</span>
        <span>{req.crm_reference}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.refRow}>
            <h2 className={styles.title}>{req.crm_reference}</h2>
            <span className={`badge ${PRIORITY_CLS[req.priority]}`}>{req.priority}</span>
            <span className={`badge ${STATUS_CLS[req.status] || 'badge-neutral'}`}>{req.status?.replace('_', ' ')}</span>
          </div>
          <div className={styles.product}>{req.product_category}</div>
        </div>
        <div className={styles.headerRight}>
          <SLAGauge percentage={req.sla_percentage || 0} size={120} label="Active SLA" />
        </div>
      </div>

      {/* Metadata Grid */}
      <div className={`grid-4 ${styles.metaGrid}`}>
        <div className={`card ${styles.metaCard}`}>
          <div className={styles.metaLabel}>Customer</div>
          <div className={styles.metaValue}>{req.customer?.name}</div>
          <div className={styles.metaSub}>{req.customer?.company}</div>
        </div>
        <div className={`card ${styles.metaCard}`}>
          <div className={styles.metaLabel}>Region</div>
          <div className={styles.metaValue}>{req.customer?.region}</div>
          <div className={styles.metaSub}>{req.customer?.phone}</div>
        </div>
        <div className={`card ${styles.metaCard}`}>
          <div className={styles.metaLabel}>Current Stage</div>
          <div className={styles.metaValue}>{STAGE_LABELS[req.current_stage] || req.current_stage}</div>
          <div className={styles.metaSub}>{req.assigned_department}</div>
        </div>
        <div className={`card ${styles.metaCard}`}>
          <div className={styles.metaLabel}>Created</div>
          <div className={styles.metaValue} style={{ fontSize: 14 }}>{formatDate(req.created_at)}</div>
          <div className={styles.metaSub}>ERP: {req.erp_reference}</div>
        </div>
      </div>

      {/* Swimlane Timeline */}
      <div className="card" style={{ padding: 'var(--sp-xl)' }}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Journey Timeline</h3>
          <span className={styles.sectionSub}>Department swimlane view</span>
        </div>
        {journeyLoading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : (
          <SwimlaneTimeline stages={journey || []} />
        )}
      </div>

      {/* Event Log */}
      <div className="card" style={{ padding: 'var(--sp-xl)' }}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Event Log</h3>
          <span className={styles.sectionSub}>{req.events?.length || 0} events recorded</span>
        </div>
        <EventLog events={req.events || []} />
      </div>
    </div>
  );
}
