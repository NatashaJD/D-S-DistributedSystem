'use client';
import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from './useAPI';

const CACHE_PREFIX = 'hc_chart:';

function readCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp, ttl } = JSON.parse(raw);
    if (Date.now() - timestamp > ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(key, data, ttl) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
  } catch {
    // localStorage might be full — evict oldest chart entries
    try {
      const chartKeys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      if (chartKeys.length > 0) {
        localStorage.removeItem(chartKeys[0]);
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
      }
    } catch { }
  }
}

/**
 * Fetches chart data with localStorage cache-aside.
 * @param {string} url      - API endpoint
 * @param {string} cacheKey - Unique key for localStorage
 * @param {number} ttl      - Milliseconds before cache entry is stale (default: 30s)
 */
export function useChartData(url, cacheKey, ttl = 30_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async (force = false) => {
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      writeCache(cacheKey, json, ttl);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, ttl]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_PREFIX + cacheKey);
    fetch_(true);
  }, [cacheKey, fetch_]);

  return { data, loading, error, refresh };
}

export function evictChartCache(pattern) {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX) && k.includes(pattern))
      .forEach(k => localStorage.removeItem(k));
  } catch { }
}
