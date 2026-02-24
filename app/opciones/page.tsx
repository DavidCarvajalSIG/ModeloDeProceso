"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/lib/useProgress";
import { useStageProgress } from "@/hooks/useStageProgress";
import styles from "./opciones.module.css";

export default function OpcionesPage() {
  const { reset: resetProgress } = useProgress();
  const { reset: resetStage1 } = useStageProgress();
  const [feedback, setFeedback] = useState<null | "done">(null);

  const handleFactoryReset = () => {
    const confirmed = window.confirm(
      "Esto borrará el progreso y los datos guardados de la Etapa 1 en este navegador. ¿Deseas continuar?"
    );
    if (!confirmed) return;

    resetProgress();
    resetStage1();
    setFeedback("done");
  };

  return (
    <main className={styles.page}>
      <div className={styles.bgGlow} aria-hidden="true" />

      <section className={styles.card} aria-labelledby="opciones-title">
        <header className={styles.header}>
          <p className={styles.kicker}>Configuración</p>
          <h1 id="opciones-title" className={styles.title}>
            Opciones de la experiencia
          </h1>
          <p className={styles.copy}>
            Desde aquí puedes restablecer el avance guardado localmente y volver a empezar con la
            aplicación en estado de fábrica.
          </p>
        </header>

        <div className={styles.actionCard}>
          <div className={styles.actionText}>
            <h2 className={styles.actionTitle}>Restablecer datos locales</h2>
            <p className={styles.actionCopy}>
              Elimina el progreso general y la información guardada de la Etapa 1 en este
              navegador.
            </p>
          </div>
          <button type="button" className={styles.dangerBtn} onClick={handleFactoryReset}>
            Borrar datos y reiniciar
          </button>
        </div>

        {feedback === "done" ? (
          <div className={styles.feedbackCard} role="status" aria-live="polite">
            <strong>Restablecimiento completado</strong>
            <p>
              Se borró la información local de la experiencia. Puedes iniciar de nuevo desde la
              pantalla principal.
            </p>
          </div>
        ) : null}

        <div className={styles.links}>
          <Link href="/inicio" className={styles.linkBtn}>
            Volver al inicio
          </Link>
          <Link href="/etapa-1" className={styles.linkBtnSecondary}>
            Ir a Etapa 1
          </Link>
        </div>
      </section>
    </main>
  );
}
