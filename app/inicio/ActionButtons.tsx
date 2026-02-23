"use client";

import Link from "next/link";
import styles from "./inicio.module.css";
import { useProgress } from "../../lib/useProgress";

type BtnVariant = "primary" | "secondary" | "danger";

function ButtonUI({
  label,
  variant,
  as = "button",
  href,
  onClick,
}: {
  label: string;
  variant: BtnVariant;
  as?: "link" | "button";
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "danger"
      ? styles.btnDanger
      : styles.btnSecondary;

  const content = (
    <>
      <span className={styles.btnGlow} aria-hidden="true" />
      <span className={styles.btnHud} aria-hidden="true" />
      <span className={styles.btnText}>{label}</span>
    </>
  );

  if (as === "link" && href) {
    return (
      <Link href={href} className={`${styles.btnBase} ${cls}`}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={`${styles.btnBase} ${cls}`} onClick={onClick}>
      {content}
    </button>
  );
}

export default function ActionButtons() {
  const { progress, ready } = useProgress();
  const showContinue = ready && progress.hasStarted;

  return (
    <div className={styles.buttonsCol}>
      {showContinue && (
        <ButtonUI
          label="Continuar"
          variant="secondary"
          as="link"
          href={progress.lastRoute || "/etapa-1"}
        />
      )}

      <ButtonUI label="Iniciar" variant="primary" as="link" href="/etapa-1" />

      {/* Por ahora no hacen nada, pero quedan visualmente igual */}
      <ButtonUI label="Opciones" variant="danger" as="link" href="" />
    </div>
  );
}
