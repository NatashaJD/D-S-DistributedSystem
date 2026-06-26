'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="1.5" width="48" height="48">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF5FB', margin: 0 }}>Something went wrong</h2>
      <p style={{ fontSize: 13, color: '#8BA0B2', margin: 0 }}>{error?.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} style={{ marginTop: 8, fontSize: 13, color: '#00AEEF', background: 'transparent', border: '1px solid rgba(0,174,239,0.3)', borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontWeight: 600 }}>
        Try again
      </button>
    </div>
  );
}
