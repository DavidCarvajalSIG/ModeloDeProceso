"use client";

import type { ReactNode } from "react";
import MiniSpiralViewer from "@/components/mini-spiral-viewer/MiniSpiralViewer";
import TechTrailBackground from "@/components/tech-trail-background/TechTrailBackground";
import styles from "./stage.module.css";

type StageShellProps = {
  children: ReactNode;
  viewerTitle: string;
  viewerStatusLabel: string;
  viewerStatusTone?: "active" | "done";
  viewerMeta?: Array<{ label: string; value: string }>;
  viewerEnabled?: boolean;
};

export default function StageShell({
  children,
  viewerTitle,
  viewerStatusLabel,
  viewerStatusTone = "active",
  viewerMeta = [],
  viewerEnabled = true,
}: StageShellProps) {
  return (
    <div className={styles.stageRoot}>
      <TechTrailBackground className={styles.techBackground} />

      {viewerEnabled ? (
        <aside className={styles.viewerDock} aria-label="Visor del modelo 3D">
          <div className={styles.viewerHeader}>
            <div>
              <p className={styles.viewerEyebrow}>Modelo espiral GenAI</p>
              <h2 className={styles.viewerTitle}>{viewerTitle}</h2>
            </div>
            <span
              className={`${styles.viewerStatus} ${
                viewerStatusTone === "done"
                  ? styles.viewerStatus_done
                  : styles.viewerStatus_active
              }`}
            >
              {viewerStatusLabel}
            </span>
          </div>

          <div className={styles.viewerCanvasWrap}>
            <MiniSpiralViewer />
          </div>

          <div className={styles.viewerMeta}>
            {viewerMeta.map((row) => (
              <div key={row.label} className={styles.viewerMetaRow}>
                <span className={styles.viewerMetaKey}>{row.label}</span>
                <span className={styles.viewerMetaValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </aside>
      ) : null}

      <main className={`${styles.main} ${!viewerEnabled ? styles.mainNoViewer : ""}`.trim()}>
        <div
          className={`${styles.contentColumn} ${!viewerEnabled ? styles.contentColumnNoViewer : ""}`.trim()}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
