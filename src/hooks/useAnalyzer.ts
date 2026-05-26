import { useState, useCallback, useRef } from 'react';
import {
  buildResult,
  clientSideOptimize,
} from '@/lib/analyzer';
import type { AnalyzerState, AnalysisResult } from '@/types';

const API_URL = '/api/analyze';
const CACHE_MAX_SIZE = 100;
const CACHE_TTL_MS = 3600000; // 1 hour

interface CacheEntry {
  result: AnalysisResult;
  timestamp: number;
}

// LRU Cache with TTL and size limits
class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 3600000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): AnalysisResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  set(key: string, result: AnalysisResult): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new LRUCache(CACHE_MAX_SIZE, CACHE_TTL_MS);

export function useAnalyzer() {
  const [state, setState] = useState<AnalyzerState>({
    loading: false,
    error: null,
    result: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    // Return cached result immediately
    if (cache.has(trimmed)) {
      const cachedResult = cache.get(trimmed);
      if (cachedResult) {
        setState({ loading: false, error: null, result: cachedResult });
        return;
      }
    }

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ loading: true, error: null, result: null });

    // ── 1. Try the serverless API ─────────────────────────────────────────────
    let result: AnalysisResult | null = null;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
        signal: controller.signal,
      });

      if (res.ok) {
        result = await res.json();
      }
      // Non-OK response → fall through to client-side fallback
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      // Network error (no backend running) → fall through to client-side fallback
    }

    // ── 2. Client-side fallback (always succeeds) ─────────────────────────────
    if (!result) {
      const optimized = clientSideOptimize(trimmed);
      result = buildResult(trimmed, optimized);
    }

    cache.set(trimmed, result);
    setState({ loading: false, error: null, result });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ loading: false, error: null, result: null });
  }, []);

  return { ...state, analyze, reset };
}
