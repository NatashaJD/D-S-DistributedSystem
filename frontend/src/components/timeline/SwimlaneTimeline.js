'use client';
import styles from './SwimlaneTimeline.module.css';

const DEPARTMENTS = ['Sales', 'Engineering', 'Quotations', 'Logistics'];

const DEPT_COLORS = {
  Sales:       'var(--color-sales)',
  Engineering: 'var(--color-engineering)',
  Quotations:  'var(--color-quotations)',
  Logistics:   'var(--color-logistics)',
};

const STATUS_COLORS = {
  on_track:  'var(--color-success)',
  warning:   'var(--color-warning)',
  breached:  'var(--color-danger)',
  critical:  'var(--color-critical)',
  completed: 'var(--color-success)',
};

const STATUS_LABELS = {
  on_track:  'On Track',
  warning:   'Warning',
  breached:  'Breached',
  critical:  'Critical',
  completed: 'Completed',
};

const STAGE_TO_DEPT = {
  inquiry: 'Sales',
  engineering_review: 'Engineering',
  quotation: 'Quotations',
  dispatch: 'Logistics',
  delivered: 'Logistics',
};

function formatTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const diff = new Date(endIso) - new Date(startIso);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StageNode({ stage }) {
  const color = STATUS_COLORS[stage.status] || 'var(--color-text-muted)';
  const isCritical = stage.status === 'critical';

  return (
    <div className={styles.stageNode}>
      <div
        className={`${styles.nodeDot} ${isCritical ? styles.nodePulse : ''}`}
        style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
      />
      <div className={styles.nodeCard}>
        <div className={styles.nodeHeader}>
          <span className={styles.nodeName}>{stage.stage_display || stage.stage_name}</span>
          <span className={styles.nodeStatus} style={{ color, background: `${color}18` }}>
            {STATUS_LABELS[stage.status] || stage.status}
          </span>
        </div>
        <div className={styles.nodeMeta}>
          <span>Start: {formatTime(stage.started_at)}</span>
          {stage.completed_at && <span>End: {formatTime(stage.completed_at)}</span>}
          {stage.sla_deadline && !stage.completed_at && (
            <span style={{ color: 'var(--color-warning)' }}>SLA: {formatTime(stage.sla_deadline)}</span>
          )}
        </div>
        <div className={styles.nodeSLA}>
          <div className={styles.slaTrack}>
            <div
              className={styles.slaFill}
              style={{
                width: `${Math.min(stage.sla_percentage || 0, 200) / 2}%`,
                background: color,
              }}
            />
            {/* 75% marker */}
            <div className={styles.slaMarker75} title="75% SLA" />
          </div>
          <span className={styles.slaPct} style={{ color }}>{Math.round(stage.sla_percentage || 0)}%</span>
        </div>
        {stage.assigned_to && (
          <div className={styles.nodeAssignee}>👤 {stage.assigned_to}</div>
        )}
        {stage.completed_at && stage.started_at && (
          <div className={styles.nodeDuration}>
            ⏱ {formatDuration(stage.started_at, stage.completed_at)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SwimlaneTimeline({ stages = [] }) {
  // Group stages by department
  const laneStages = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = stages.filter(s => (s.department || STAGE_TO_DEPT[s.stage_name]) === dept);
    return acc;
  }, {});

  return (
    <div className={styles.swimlane}>
      {DEPARTMENTS.map(dept => {
        const deptStages = laneStages[dept];
        const color = DEPT_COLORS[dept];
        const hasActive = deptStages.some(s => !s.completed_at);
        const hasBreached = deptStages.some(s => ['breached', 'critical'].includes(s.status));

        return (
          <div key={dept} className={styles.lane}>
            {/* Lane Header */}
            <div className={styles.laneHeader} style={{ borderLeftColor: color }}>
              <div className={styles.laneDot} style={{ background: color }} />
              <span className={styles.laneName}>{dept}</span>
              {hasBreached && <span className={styles.laneAlert}>⚠</span>}
              {hasActive && !hasBreached && <span className={styles.laneActive} style={{ color }}>● Active</span>}
            </div>

            {/* Stages */}
            <div className={styles.laneContent}>
              {deptStages.length === 0 ? (
                <div className={styles.emptyLane}>No activity yet</div>
              ) : (
                <div className={styles.stagesRow}>
                  {deptStages.map((stage, i) => (
                    <div key={stage.stage_id || i} className={styles.stageWrapper}>
                      {i > 0 && <div className={styles.connector} />}
                      <StageNode stage={stage} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
