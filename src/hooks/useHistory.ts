import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult } from '@/types';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  result: AnalysisResult;
}

const STORAGE_KEY = 'token_analyzer_history';
const MAX_ENTRIES = 50;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(load);

  // Keep storage in sync whenever history changes
  useEffect(() => {
    save(history);
  }, [history]);

  const addEntry = useCallback((result: AnalysisResult) => {
    setHistory((prev) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        result,
      };
      return [entry, ...prev].slice(0, MAX_ENTRIES);
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  // ── Aggregated stats ────────────────────────────────────────────────────────
  const stats = {
    totalAnalyses:       history.length,
    totalTokensAnalyzed: history.reduce((s, e) => s + e.result.original.tokens,          0),
    totalTokensSaved:    history.reduce((s, e) => s + e.result.savings.tokens,            0),
    totalEnergySaved:    history.reduce((s, e) => s + e.result.savings.energy,            0),
    totalCostSaved:      history.reduce((s, e) => s + e.result.savings.cost,              0),
    totalCarbonSaved:    history.reduce((s, e) => s + e.result.savings.carbon,            0),
  };

  // ── Chart data: last 7 analyses in chronological order ─────────────────────
  const recentChart = [...history]
    .slice(0, 7)
    .reverse()
    .map((e, i) => ({
      name:   `#${i + 1}`,
      tokens: e.result.original.tokens,
      saved:  e.result.savings.tokens,
    }));

  // ── Carbon per-session for bar chart ───────────────────────────────────────
  const carbonChart = [...history]
    .slice(0, 6)
    .reverse()
    .map((e, i) => ({
      name: `#${i + 1}`,
      kg:   Number((e.result.original.carbonFootprint * 1e6).toFixed(4)), // mg scale
      saved: Number((e.result.savings.carbon * 1e6).toFixed(4)),
    }));

  return { history, stats, recentChart, carbonChart, addEntry, clearHistory };
}
