import { useState, useCallback, useRef } from 'react';
import {
  buildResult,
  clientSideOptimize,
} from '@/lib/analyzer';
import type { AnalyzerState, AnalysisResult } from '@/types';

const API_URL = '/api/analyze';

// Simple in-memory cache keyed by trimmed prompt text
const cache = new Map<string, AnalysisResult>();

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
      setState({ loading: false, error: null, result: cache.get(trimmed)! });
      return;
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
