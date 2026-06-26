'use client';
import { useState, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { apiPost } from '../../hooks/useAPI';
import styles from './page.module.css';

const SUGGESTED = [
  'Show me all SLA breaches this month',
  'Which region has the most delayed requests?',
  'What is the average processing time for Engineering Review?',
  'List the top 10 critical priority requests',
  'Show requests by product category',
  'Which department has the lowest compliance rate?',
];

function ResultTable({ columns = [], rows = [] }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.resultTable}>
        <thead>
          <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{String(cell ?? '-')}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className={styles.noResults}>No results returned</div>}
    </div>
  );
}

function ResultChart({ columns = [], rows = [] }) {
  if (columns.length < 2) return <ResultTable columns={columns} rows={rows} />;
  const labelCol = columns[0];
  const valueCol = columns[1];
  const chartData = rows.map(r => ({ [labelCol]: String(r[0]), [valueCol]: Number(r[1]) || 0 }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 40, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey={labelCol} tick={{ fill: '#9CA3AF', fontSize: 10, angle: -20, textAnchor: 'end' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8 }} labelStyle={{ color: '#F9FAFB' }} />
        <Bar dataKey={valueCol} fill="#0054A6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function QueryBubble({ query, response, loading }) {
  return (
    <div className={styles.queryBubble}>
      <div className={styles.questionBubble}>
        <div className={styles.bubbleIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div className={styles.bubbleText}>{query}</div>
      </div>
      {loading ? (
        <div className={styles.loadingBubble}>
          <div className={styles.bubbleIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 2a3 3 0 0 0-3 3v6h6V5a3 3 0 0 0-3-3z"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.thinkingDots}>
            <span /><span /><span />
          </div>
        </div>
      ) : response ? (
        <div className={styles.responseBubble}>
          <div className={styles.bubbleIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 2a3 3 0 0 0-3 3v6h6V5a3 3 0 0 0-3-3z"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.responseContent}>
            {response.summary && <p className={styles.summary}>{response.summary}</p>}
            {response.error && (
              <p className={styles.errorText}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13" strokeLinecap="round" style={{ marginRight: 5, flexShrink: 0, display: 'inline' }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {response.error}
              </p>
            )}
            {response.data && response.result_type === 'chart' && (
              <ResultChart columns={response.data.columns} rows={response.data.rows} />
            )}
            {response.data && response.result_type !== 'chart' && (
              <ResultTable columns={response.data.columns} rows={response.data.rows} />
            )}
            {response.sql && (
              <details className={styles.sqlDetails}>
                <summary>View SQL Query</summary>
                <pre className={styles.sqlBlock}>{response.sql}</pre>
              </details>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CopilotPage() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  const role = typeof window !== 'undefined' ? (localStorage.getItem('dayliff_role') || 'admin') : 'admin';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const submit = async (question) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setLoading(true);
    setHistory(h => [...h, { query: q, response: null, loading: true }]);

    try {
      const res = await apiPost('/api/v1/copilot/query', { question: q, role });
      setHistory(h => h.map((item, idx) => idx === h.length - 1 ? { ...item, response: res, loading: false } : item));
    } catch (e) {
      setHistory(h => h.map((item, idx) => idx === h.length - 1
        ? { ...item, response: { error: e.message, result_type: 'text', sql: null, data: null }, loading: false }
        : item));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>AI Copilot</h2>
          <p className={styles.subtitle}>Powered by Google Gemini. Ask anything about your operations data.</p>
        </div>
        <div className={styles.badge}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Gemini 2.5 Flash</span>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Chat area */}
        <div className={styles.chatArea}>
          <div className={styles.messages}>
            {history.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  <line x1="9" y1="10" x2="9" y2="10"/>
                  <line x1="12" y1="10" x2="12" y2="10"/>
                  <line x1="15" y1="10" x2="15" y2="10"/>
                </svg>
              </div>
                <h3>Ask about your operations</h3>
                <p>Use natural language to query the Dayliff 1000 Eyes database. Your role access is automatically applied.</p>
              </div>
            )}
            {history.map((item, i) => (
              <QueryBubble key={i} query={item.query} response={item.response} loading={item.loading} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              className={styles.queryInput}
              placeholder="Ask a question about requests, SLAs, departments, or regions..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={loading}
            />
            <button
              className={`btn btn-primary ${styles.sendBtn}`}
              onClick={() => submit(input)}
              disabled={!input.trim() || loading}
            >
              {loading ? '...' : '→ Ask'}
            </button>
          </div>
          <div className={styles.inputHint}>Press Enter to send · Shift+Enter for new line · Bounded by your role permissions</div>
        </div>

        {/* Suggestions sidebar */}
        <div className={styles.sidebar}>
          <div className={`card ${styles.suggestCard}`}>
            <div className={styles.suggestTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              Suggested Questions
            </div>
            <div className={styles.suggestions}>
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  className={styles.suggestion}
                  onClick={() => submit(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={`card ${styles.infoCard}`}>
            <div className={styles.suggestTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Access Control
            </div>
            <div className={styles.infoText}>
              Your queries are bounded by PostgreSQL Row-Level Security. The AI cannot access data outside your role&apos;s permissions.
            </div>
            <div className={styles.rolePill}>Role: {role?.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
