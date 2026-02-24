"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { StageFlagKey } from "@/types/stage";
import { isEmailValid } from "@/lib/validation";

export type Stage1ResultStateId = "inicial" | "intermedio" | "avanzado";

export type Stage1ProgressState = {
  stage1AnimationStarted: boolean;
  consentAdmin: boolean;
  consentUsage: boolean;
  email: string;
  autodiagnosticStarted: boolean;
  autodiagnosticCompleted: boolean;
  resultStateId: Stage1ResultStateId;
  intentionText: string;
  emotion: string;
  intentionSaved: boolean;
  stage1AnimationViewed: boolean;
  transitionAnimationViewed: boolean;
};

const STORAGE_KEY = "stage1-progress-v2";
const STORAGE_EVENT = "stage1-progress-changed";

const DEFAULT_STATE: Stage1ProgressState = {
  stage1AnimationStarted: false,
  consentAdmin: false,
  consentUsage: false,
  email: "",
  autodiagnosticStarted: false,
  autodiagnosticCompleted: false,
  resultStateId: "intermedio",
  intentionText: "",
  emotion: "",
  intentionSaved: false,
  stage1AnimationViewed: false,
  transitionAnimationViewed: false,
};

let cachedStage1Raw: string | null | undefined;
let cachedStage1Snapshot: Stage1ProgressState = DEFAULT_STATE;

function coerce(raw: unknown): Stage1ProgressState {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const value = raw as Partial<Stage1ProgressState>;
  return {
    stage1AnimationStarted: Boolean(value.stage1AnimationStarted),
    consentAdmin: Boolean(value.consentAdmin),
    consentUsage: Boolean(value.consentUsage),
    email: typeof value.email === "string" ? value.email : "",
    autodiagnosticStarted: Boolean(value.autodiagnosticStarted),
    autodiagnosticCompleted: Boolean(value.autodiagnosticCompleted),
    resultStateId:
      value.resultStateId === "inicial" ||
      value.resultStateId === "intermedio" ||
      value.resultStateId === "avanzado"
        ? value.resultStateId
        : "intermedio",
    intentionText: typeof value.intentionText === "string" ? value.intentionText : "",
    emotion: typeof value.emotion === "string" ? value.emotion : "",
    intentionSaved: Boolean(value.intentionSaved),
    stage1AnimationViewed: Boolean(value.stage1AnimationViewed),
    transitionAnimationViewed: Boolean(value.transitionAnimationViewed),
  };
}

function readStage1ProgressSnapshot(): Stage1ProgressState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedStage1Raw) return cachedStage1Snapshot;
    cachedStage1Raw = raw;
    if (!raw) {
      cachedStage1Snapshot = DEFAULT_STATE;
      return cachedStage1Snapshot;
    }
    cachedStage1Snapshot = coerce(JSON.parse(raw));
    return cachedStage1Snapshot;
  } catch {
    cachedStage1Raw = null;
    cachedStage1Snapshot = DEFAULT_STATE;
    return cachedStage1Snapshot;
  }
}

function subscribeToStage1Progress(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) return;
    onStoreChange();
  };

  const onCustom = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(STORAGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORAGE_EVENT, onCustom);
  };
}

export function clearStage1Progress() {
  if (typeof window === "undefined") return;
  cachedStage1Raw = null;
  cachedStage1Snapshot = DEFAULT_STATE;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function useStageProgress() {
  const state = useSyncExternalStore(
    subscribeToStage1Progress,
    readStage1ProgressSnapshot,
    () => DEFAULT_STATE
  );

  const update = useCallback((patch: Partial<Stage1ProgressState>) => {
    if (typeof window === "undefined") return;
    const current = readStage1ProgressSnapshot();
    const next: Stage1ProgressState = { ...current, ...patch };
    const raw = JSON.stringify(next);
    cachedStage1Raw = raw;
    cachedStage1Snapshot = next;
    window.localStorage.setItem(STORAGE_KEY, raw);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, []);

  const reset = useCallback(() => {
    clearStage1Progress();
  }, []);

  const flags = useMemo<Record<StageFlagKey, boolean>>(
    () => ({
      stage1AnimationViewed: state.stage1AnimationViewed,
      consentValidated:
        state.stage1AnimationViewed &&
        state.consentAdmin &&
        state.consentUsage &&
        isEmailValid(state.email),
      autodiagnosticStarted: state.autodiagnosticStarted,
      autodiagnosticCompleted: state.autodiagnosticCompleted,
      intentionSaved: state.intentionSaved,
      transitionAnimationViewed: state.transitionAnimationViewed,
    }),
    [state]
  );

  return { state, update, reset, flags };
}
