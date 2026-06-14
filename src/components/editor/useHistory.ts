"use client";

import { useCallback, useState } from "react";
import type { CreativeState } from "@/lib/creative/types";

const MAX_HISTORY = 50;

interface HistoryRecord {
  past: CreativeState[];
  present: CreativeState;
  future: CreativeState[];
}

export function useHistory(initial: CreativeState) {
  const [history, setHistory] = useState<HistoryRecord>({
    past: [],
    present: initial,
    future: [],
  });

  const setState = useCallback(
    (next: CreativeState | ((prev: CreativeState) => CreativeState)) => {
      setHistory((h) => {
        const nextState = typeof next === "function" ? next(h.present) : next;
        return {
          past: [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
          present: nextState,
          future: [],
        };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: prev,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
