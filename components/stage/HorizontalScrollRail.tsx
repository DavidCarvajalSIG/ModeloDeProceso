"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useScrollPin } from "@/hooks/useScrollPin";
import type { RailPanel } from "@/types/stage";
import styles from "./stage.module.css";

type HorizontalScrollRailProps = {
  panels: RailPanel[];
};

export default function HorizontalScrollRail({ panels }: HorizontalScrollRailProps) {
  const pinAreaRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [maxOffset, setMaxOffset] = useState(0);
  const { progress } = useScrollPin(pinAreaRef);

  useEffect(() => {
    let rafId = 0;
    const measure = () => {
      rafId = 0;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;
      setMaxOffset(Math.max(0, track.scrollWidth - viewport.clientWidth));
    };
    const schedule = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
    };
  }, [panels.length]);

  const style = useMemo(
    () =>
      ({
        "--rail-height-multiplier": Math.max(3.2, panels.length * 0.85),
      }) as CSSProperties,
    [panels.length]
  );

  return (
    <div ref={pinAreaRef} className={styles.railPinArea} style={style}>
      <div className={styles.railSticky}>
        <div className={styles.railHead}>
          <span className={styles.railLabel}>Resumen del modelo</span>
          <h3 className={styles.railTitle}>Recorrido de las 6 etapas</h3>
          <p className={styles.railHint}>
            El desplazamiento vertical mueve los paneles en horizontal.
          </p>
        </div>

        <div ref={viewportRef} className={styles.railViewport}>
          <div
            ref={trackRef}
            className={styles.railTrack}
            style={{ transform: `translate3d(${-maxOffset * progress}px,0,0)` }}
          >
            {panels.map((panel, index) => (
              <article
                key={panel.id}
                className={`${styles.railPanel} ${
                  panel.kind === "intro" ? styles.railPanelIntro : ""
                }`}
              >
                <div className={styles.railPanelInner}>
                  <span className={styles.railPanelTag}>
                    {panel.label ?? (panel.kind === "intro" ? "Introducción" : `Etapa ${index}`)}
                  </span>
                  <h4 className={styles.railPanelTitle}>{panel.title}</h4>
                  <p className={styles.railPanelCopy}>{panel.lines[0]}</p>
                  <p className={styles.railPanelCopy}>{panel.lines[1]}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.railProgressTrack} aria-hidden="true">
          <div className={styles.railProgressFill} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
