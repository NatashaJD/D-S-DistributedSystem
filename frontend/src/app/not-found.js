export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#00AEEF" strokeWidth="1.5" width="48" height="48">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v3m0 3h.01"/>
      </svg>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF5FB', margin: 0 }}>Page not found</h2>
      <p style={{ fontSize: 13, color: '#8BA0B2', margin: 0 }}>The page you requested does not exist.</p>
      <a href="/" style={{ marginTop: 8, fontSize: 13, color: '#00AEEF', textDecoration: 'none', fontWeight: 600 }}>Return to dashboard</a>
    </div>
  );
}
