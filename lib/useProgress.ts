"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ProgressState, readProgress, writeProgress, clearProgress } from "./progress";

const PROGRESS_EVENT = "ai-tech-ed-progress-changed";

const SERVER_SNAPSHOT: ProgressState = {
  hasStarted: false,
  lastRoute: "/modelo",
  updatedAt: 0,
};

let cachedProgressSnapshot: ProgressState = SERVER_SNAPSHOT;

function readProgressSnapshot(): ProgressState {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  const next = readProgress();
  if (
    cachedProgressSnapshot.hasStarted === next.hasStarted &&
    cachedProgressSnapshot.lastRoute === next.lastRoute &&
    cachedProgressSnapshot.updatedAt === next.updatedAt
  ) {
    return cachedProgressSnapshot;
  }
  cachedProgressSnapshot = next;
  return cachedProgressSnapshot;
}

function subscribeToProgress(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== "ai-tech-ed-progress") return;
    onStoreChange();
  };
  const onCustom = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(PROGRESS_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PROGRESS_EVENT, onCustom);
  };
}

export function useProgress() {
  const progress = useSyncExternalStore(
    subscribeToProgress,
    readProgressSnapshot,
    () => SERVER_SNAPSHOT
  );
  const ready = true;

  const set = useCallback((patch: Partial<ProgressState>) => {
    if (typeof window === "undefined") return;
    writeProgress(patch);
    cachedProgressSnapshot = readProgress();
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }, []);

  const reset = useCallback(() => {
    if (typeof window === "undefined") return;
    clearProgress();
    cachedProgressSnapshot = SERVER_SNAPSHOT;
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }, []);

  return { progress, set, reset, ready };
}
