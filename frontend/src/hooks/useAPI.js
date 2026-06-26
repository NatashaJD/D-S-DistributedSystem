'use client';
import { useState, useEffect, useCallback } from 'react';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useAPI(path, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export async function apiPost(path, body) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
