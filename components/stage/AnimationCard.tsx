"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./stage.module.css";

type AnimationCardProps = {
  title: string;
  description: string;
  videoSrc: string;
  completed: boolean;
  onComplete: () => void;
  footer?: ReactNode;
  reducedMotionWaitMs?: number;
  autoplayOnVisible?: boolean;
  blockAdvanceUntilComplete?: boolean;
  blockedAdvanceMessage?: string;
  onPlayStart?: () => void;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return reduced;
}

export default function AnimationCard({
  title,
  description,
  videoSrc,
  completed,
  onComplete,
  footer,
  reducedMotionWaitMs = 900,
  autoplayOnVisible = true,
  blockAdvanceUntilComplete = false,
  blockedAdvanceMessage = "Debes reproducir y completar este video para continuar con la siguiente parte de la etapa.",
  onPlayStart,
}: AnimationCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchYRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reducedReady, setReducedReady] = useState(false);
  const [showBlockedFeedback, setShowBlockedFeedback] = useState(false);
  const playNotifiedRef = useRef(false);

  const showBlockedCard = useCallback(() => {
    setShowBlockedFeedback(true);
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setShowBlockedFeedback(false);
      feedbackTimerRef.current = null;
    }, 2800);
  }, []);

  const play = useCallback(async () => {
    if (prefersReducedMotion || completed) return;
    const video = videoRef.current;
    if (!video) return;
    try {
      video.currentTime = 0;
      await video.play();
      setStarted(true);
      setPlaying(true);
    } catch {
      setStarted(false);
      setPlaying(false);
    }
  }, [completed, prefersReducedMotion]);

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const nextVisible = entry.isIntersecting && entry.intersectionRatio > 0.45;
      setIsVisible(nextVisible);
      if (!nextVisible) return;
        if (autoplayOnVisible && !prefersReducedMotion && !completed && !started) {
          void play();
        }
      },
      { threshold: [0.2, 0.45, 0.75] }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [autoplayOnVisible, completed, play, prefersReducedMotion, started]);

  useEffect(() => {
    if (!prefersReducedMotion || !isVisible || completed) return;
    const timer = window.setTimeout(() => setReducedReady(true), reducedMotionWaitMs);
    return () => window.clearTimeout(timer);
  }, [completed, isVisible, prefersReducedMotion, reducedMotionWaitMs]);

  useEffect(() => {
    const shouldBlockAdvance = !completed && isVisible && (playing || blockAdvanceUntilComplete);
    if (!shouldBlockAdvance) return;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0) return;
      event.preventDefault();
      if (blockAdvanceUntilComplete) showBlockedCard();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " " || event.key === "End") {
        event.preventDefault();
        if (blockAdvanceUntilComplete) showBlockedCard();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY;
      if (currentY == null || touchYRef.current == null) return;
      if (currentY < touchYRef.current) {
        event.preventDefault();
        if (blockAdvanceUntilComplete) showBlockedCard();
      }
      touchYRef.current = currentY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [blockAdvanceUntilComplete, completed, isVisible, playing, showBlockedCard]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!completed) return;
    playNotifiedRef.current = true;
  }, [completed]);

  const statusLabel = completed ? "Vista" : playing ? "Reproduciendo" : "Pendiente";
  const showManualPlay = useMemo(
    () => !prefersReducedMotion && !completed && (!started || !playing),
    [completed, playing, prefersReducedMotion, started]
  );

  return (
    <div
      ref={rootRef}
      className={`${styles.animationCard} ${completed ? styles.animationCardDone : ""}`}
    >
      <div className={styles.animationHead}>
        <div>
          <h3 className={styles.animationTitle}>{title}</h3>
          <p className={styles.animationDescription}>{description}</p>
        </div>
        <span className={`${styles.statusChip} ${completed ? styles.statusChipDone : ""}`}>
          {statusLabel}
        </span>
      </div>

      <div className={styles.animationViewport}>
        {prefersReducedMotion ? (
          <div className={styles.reducedMotionFallback}>
            <div className={styles.reducedMotionFrame} />
            <p>
              Movimiento reducido activo. La vista se mantiene estática; la confirmación se habilita al completar el tiempo de visualización.
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className={styles.animationVideo}
            src={videoSrc}
            playsInline
            controls={false}
            preload="metadata"
            onPlay={() => {
              setStarted(true);
              setPlaying(true);
              if (!playNotifiedRef.current) {
                playNotifiedRef.current = true;
                onPlayStart?.();
              }
            }}
            onPause={() => {
              if (!completed) setPlaying(false);
            }}
            onEnded={() => {
              setPlaying(false);
              onComplete();
            }}
          />
        )}
      </div>

      {showBlockedFeedback && !completed ? (
        <div className={styles.animationFeedbackCard} role="status" aria-live="polite">
          <strong className={styles.animationFeedbackTitle}>Avance bloqueado temporalmente</strong>
          <p className={styles.animationFeedbackBody}>{blockedAdvanceMessage}</p>
        </div>
      ) : null}

      <div className={styles.animationFooter}>
        {showManualPlay ? (
          <button type="button" className={styles.buttonSecondary} onClick={() => void play()}>
            {started ? "Reproducir de nuevo" : "Reproducir"}
          </button>
        ) : null}

        {prefersReducedMotion && !completed ? (
          <button
            type="button"
            className={styles.buttonSecondary}
            disabled={!reducedReady}
            onClick={onComplete}
          >
            {reducedReady ? "Confirmar visualización" : "Preparando vista..."}
          </button>
        ) : null}

        {footer}
      </div>
    </div>
  );
}
