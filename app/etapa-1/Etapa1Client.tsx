"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import TechTrailBackground from "@/components/tech-trail-background/TechTrailBackground";
import MiniSpiralViewer from "@/components/mini-spiral-viewer/MiniSpiralViewer";
import CharacterStepDialog, {
  type CharacterDialogStep,
} from "@/components/character-step-dialog/CharacterStepDialog";
import styles from "./etapa1.module.css";
import { writeProgress } from "../../lib/progress";

const TRANSITION_VIDEO_URL = "/videos/TransicionE1-a-E2.mp4";
const MODEL_INTRO_VIDEO_URL = "/videos/intro-modelo.mp4";
const INTRO_ANIMATION_MS = 2600;
const REDUCED_MOTION_MIN_MS = 900;
const STOPS_TOTAL = 8;
const STORAGE_KEY = "etapa1-scroll-autodiagnostico";

type StopState = "locked" | "upcoming" | "active" | "done";

type PersistedEtapa1State = {
  consentEmail?: string;
  quizCompleted?: boolean;
  intentionText?: string;
  emotion?: string;
  intentionSaved?: boolean;
};

type StopShellProps = {
  index: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  registerStopRef: (index: number, node: HTMLElement | null) => void;
  state: StopState;
  activeIndex: number;
  revealed?: boolean;
  surface?: "card" | "plain";
};

type AnimationFrameCardProps = {
  title: string;
  description: string;
  statusLabel: string;
  completed: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

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

function StopShell({
  index,
  title,
  subtitle,
  children,
  registerStopRef,
  state,
  activeIndex,
  revealed = false,
  surface = "plain",
}: StopShellProps) {
  const header = (
    <div className={surface === "plain" ? styles.plainHeader : styles.cardHeader}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {subtitle ? <p className={styles.cardSubtitle}>{subtitle}</p> : null}
    </div>
  );

  const body = (
    <div className={surface === "plain" ? styles.plainBody : styles.cardBody}>
      {children}
    </div>
  );

  return (
    <section
      ref={(node) => {
        registerStopRef(index, node);
      }}
      className={`${styles.stop} ${styles[`stop_${state}`]}`}
      data-stop-index={index}
      data-active={activeIndex === index ? "true" : "false"}
      data-revealed={revealed ? "true" : "false"}
      aria-label={`Stop ${index + 1}: ${title}`}
    >
      <div className={styles.stopInner}>
        <div className={styles.stopBadgeRow}>
          <span className={styles.stopBadge}>STOP {index + 1}</span>
          <span className={styles.stopStateLabel}>
            {state === "done"
              ? "Completado"
              : state === "active"
                ? "Activo"
                : state === "locked"
                  ? "Bloqueado"
                  : "Disponible"}
          </span>
        </div>

        {surface === "card" ? (
          <div className={styles.card}>
            {header}
            {body}
          </div>
        ) : (
          <div className={styles.plainSurface}>
            {header}
            {body}
          </div>
        )}
      </div>
    </section>
  );
}

function AnimationFrameCard({
  title,
  description,
  statusLabel,
  completed,
  children,
  footer,
}: AnimationFrameCardProps) {
  return (
    <div className={`${styles.animationCard} ${completed ? styles.animationCardDone : ""}`}>
      <div className={styles.animationCardHead}>
        <div>
          <div className={styles.animationCardLabel}>{title}</div>
          <p className={styles.animationCardCopy}>{description}</p>
        </div>
        <span className={`${styles.statusChip} ${completed ? styles.statusChipDone : ""}`}>
          {statusLabel}
        </span>
      </div>
      <div className={styles.animationViewport}>{children}</div>
      {footer ? <div className={styles.animationFooter}>{footer}</div> : null}
    </div>
  );
}

export default function Etapa1Client() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const stopRefs = useRef<Array<HTMLElement | null>>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modelIntroVideoRef = useRef<HTMLVideoElement | null>(null);
  const clampingRef = useRef(false);

  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [hasLeftFirstStop, setHasLeftFirstStop] = useState(false);
  const [revealedStops, setRevealedStops] = useState<boolean[]>(
    () => Array.from({ length: STOPS_TOTAL }, (_, index) => index === 0)
  );
  const [introAnimationProgress, setIntroAnimationProgress] = useState(0);
  const [introAnimationCompleted, setIntroAnimationCompleted] = useState(false);
  const [introReducedReady, setIntroReducedReady] = useState(false);
  const [modelIntroVideoStarted, setModelIntroVideoStarted] = useState(false);
  const [modelIntroVideoEnded, setModelIntroVideoEnded] = useState(false);

  const [consentAdmin, setConsentAdmin] = useState(false);
  const [consentUsage, setConsentUsage] = useState(false);
  const [email, setEmail] = useState("");
  const [consentTouched, setConsentTouched] = useState(false);
  const [autodiagnosticStarted, setAutodiagnosticStarted] = useState(false);

  const [showIntroLaiaHelp, setShowIntroLaiaHelp] = useState(false);
  const [showFormLaiaHelp, setShowFormLaiaHelp] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [intentionText, setIntentionText] = useState("");
  const [emotion, setEmotion] = useState("");
  const [intentionTouched, setIntentionTouched] = useState(false);
  const [intentionSaved, setIntentionSaved] = useState(false);
  const [transitionVideoStarted, setTransitionVideoStarted] = useState(false);
  const [transitionVideoEnded, setTransitionVideoEnded] = useState(false);
  const [transitionReducedReady, setTransitionReducedReady] = useState(false);

  const registerStopRef = useCallback(
    (index: number, node: HTMLElement | null) => {
      stopRefs.current[index] = node;
    },
    []
  );

  const consentValid = consentAdmin && consentUsage && isEmailValid(email);
  const intentionValid = intentionText.trim().length > 0;
  const etapa1Completed = quizCompleted && intentionSaved;
  const introStopCompleted = introAnimationCompleted && modelIntroVideoEnded;
  const showDockedViewer = activeStopIndex > 0 || hasLeftFirstStop;
  const introVideoOverlayOpen = !modelIntroVideoEnded;

  const laiaIntroSteps = useMemo<CharacterDialogStep[]>(
    () => [
      {
        text: "Este recorrido acompaña la integración responsable de GenAI en experiencias de aprendizaje. Avanzarás por etapas conectadas, de forma progresiva y reflexiva.",
        imgSrc: "/ui/laia.png",
        imgAlt: "Laia - apertura etapa 1",
      },
      {
        text: "Comenzaremos ubicando tu punto de partida dentro del modelo y los estados de desarrollo docente.",
        imgSrc: "/ui/laia_explaining.png",
        imgAlt: "Laia - introducción del modelo",
      },
    ],
    []
  );

  const laiaStatesSteps = useMemo<CharacterDialogStep[]>(
    () => [
      {
        text: "Te acompañaré en puntos clave. Aquí solo necesitas comprender cómo se organiza el recorrido.",
        imgSrc: "/ui/laia_explaining.png",
        imgAlt: "Laia - estados del modelo",
      },
      {
        text: "No te voy a interrumpir mientras completes el autodiagnóstico; apareceré solo cuando aporte contexto.",
        imgSrc: "/ui/laia_explaining_holo.png",
        imgAlt: "Laia - ayuda puntual",
      },
    ],
    []
  );

  const laiaEncuadreSteps = useMemo<CharacterDialogStep[]>(
    () => [
      {
        text: "Antes de explorar herramientas o diseñar actividades, conviene reconocer desde dónde se empieza. Esta etapa propone un autodiagnóstico para orientar el recorrido.",
        imgSrc: "/ui/laia_explaining.png",
        imgAlt: "Laia - encuadre pedagógico",
      },
      {
        text: "Tu objetivo aquí es ubicar tu punto de partida, no ser evaluado.",
        imgSrc: "/ui/laia_explaining_holo.png",
        imgAlt: "Laia - objetivo de etapa 1",
      },
    ],
    []
  );

  const laiaConsentSteps = useMemo<CharacterDialogStep[]>(
    () => [
      {
        text: "Este ejercicio es individual, objetivo y confidencial. No tiene efectos administrativos. Su único propósito es orientar el camino formativo.",
        imgSrc: "/ui/laia_explaining.png",
        imgAlt: "Laia - consentimiento",
      },
    ],
    []
  );

  const laiaResultSteps = useMemo<CharacterDialogStep[]>(
    () => [
      {
        text: "Este resultado no define capacidades; orienta condiciones de partida. El valor está en tomar decisiones formativas más coherentes.",
        imgSrc: "/ui/laia_explaining.png",
        imgAlt: "Laia - resultado",
      },
      {
        text: "Lo importante es usar este resultado como referencia para decidir tu siguiente paso en el recorrido.",
        imgSrc: "/ui/laia.png",
        imgAlt: "Laia - lectura del resultado",
      },
    ],
    []
  );

  const laiaIntentionSteps = useMemo<CharacterDialogStep[]>(
    () => [
      {
        text: "Registrar tu intención ayuda a revisar, más adelante, cómo evolucionó tu experiencia a lo largo de la espiral.",
        imgSrc: "/ui/laia_explaining.png",
        imgAlt: "Laia - intención docente",
      },
    ],
    []
  );

  const laiaBridgeSteps = useMemo<CharacterDialogStep[]>(
    () => [
      {
        text: "Con tu punto de partida identificado, el siguiente paso es explorar posibilidades reales de GenAI para fortalecer actividades concretas de aprendizaje.",
        imgSrc: "/ui/laia_explaining.png",
        imgAlt: "Laia - cierre etapa 1",
      },
      {
        text: "A continuación verás la transición a la siguiente etapa. Debes verla completa para continuar.",
        imgSrc: "/ui/laia_triumphant.png",
        imgAlt: "Laia - transición",
      },
    ],
    []
  );

  const stageNames = useMemo(
    () => [
      "Reconócete para avanzar",
      "Descubre nuevas posibilidades",
      "Diseña con propósito",
      "Prepara el terreno para el éxito",
      "Hazlo realidad en el aula",
      "Reflexiona, aprende y mejora",
    ],
    []
  );

  const stateSummaries = useMemo(
    () => [
      {
        title: "Aprendiendo sin miedo",
        text: "Estás dando tus primeros pasos y es natural sentir incertidumbre. El objetivo es familiarizarte con la IA, comprender su potencial y ganar confianza para usarla con criterio pedagógico.",
      },
      {
        title: "Explorando con propósito",
        text: "Ya has comenzado a experimentar con intención educativa. El reto ahora es afianzar lo que funciona, ampliar posibilidades y fortalecer el uso con sentido pedagógico.",
      },
      {
        title: "Innovando e inspirando",
        text: "Integras la IA de forma crítica, creativa y ética en tu práctica. También puedes inspirar a otros docentes compartiendo decisiones, aprendizajes y buenas prácticas.",
      },
    ],
    []
  );

  const factorList = useMemo(
    () => [
      "F1: Propósito — ¿Qué actividad transformar con sentido pedagógico?",
      "F2: Razonamiento crítico — ¿Qué proceso cognitivo/razonamiento crítico debe hacer el estudiante?",
      "F3: Ética — ¿Qué consideraciones éticas y de responsabilidad hay?",
      "F4: Herramientas — ¿Qué herramientas se incorporan?",
      "F5: Reflexión — ¿Qué se aprende y mejora del proceso?",
    ],
    []
  );

  useEffect(() => {
    writeProgress({ hasStarted: true, lastRoute: "/etapa-1" });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as PersistedEtapa1State;
      const rafId = window.requestAnimationFrame(() => {
        if (saved.consentEmail) setEmail(saved.consentEmail);
        if (typeof saved.quizCompleted === "boolean") {
          setQuizCompleted(saved.quizCompleted);
        }
        if (typeof saved.intentionText === "string") {
          setIntentionText(saved.intentionText);
        }
        if (typeof saved.emotion === "string") {
          setEmotion(saved.emotion);
        }
        if (typeof saved.intentionSaved === "boolean") {
          setIntentionSaved(saved.intentionSaved);
        }
      });
      return () => window.cancelAnimationFrame(rafId);
    } catch {
      // Ignore corrupted local state.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: PersistedEtapa1State = {
      consentEmail: email,
      quizCompleted,
      intentionText,
      emotion,
      intentionSaved,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [email, emotion, intentionSaved, intentionText, quizCompleted]);

  useEffect(() => {
    if (activeStopIndex !== 0 || introAnimationCompleted) return;
    if (prefersReducedMotion) {
      const timer = window.setTimeout(() => setIntroReducedReady(true), REDUCED_MOTION_MIN_MS);
      return () => window.clearTimeout(timer);
    }

    let rafId = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / INTRO_ANIMATION_MS);
      setIntroAnimationProgress(progress);
      if (progress >= 1) {
        setIntroAnimationCompleted(true);
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [activeStopIndex, introAnimationCompleted, prefersReducedMotion]);

  useEffect(() => {
    if (!prefersReducedMotion || activeStopIndex !== 7 || transitionVideoEnded) return;
    const timer = window.setTimeout(() => setTransitionReducedReady(true), REDUCED_MOTION_MIN_MS);
    return () => window.clearTimeout(timer);
  }, [activeStopIndex, prefersReducedMotion, transitionVideoEnded]);

  const unlockedByStop = useMemo(
    () => [
      true,
      introStopCompleted,
      introStopCompleted,
      introStopCompleted,
      introStopCompleted && autodiagnosticStarted,
      introStopCompleted && autodiagnosticStarted && quizCompleted,
      introStopCompleted && autodiagnosticStarted && quizCompleted,
      introStopCompleted && autodiagnosticStarted && quizCompleted && intentionSaved,
    ],
    [autodiagnosticStarted, introStopCompleted, intentionSaved, quizCompleted]
  );

  const maxUnlockedStopIndex = useMemo(() => {
    for (let i = unlockedByStop.length - 1; i >= 0; i -= 1) {
      if (unlockedByStop[i]) return i;
    }
    return 0;
  }, [unlockedByStop]);

  const getStopState = useCallback(
    (index: number): StopState => {
      if (index < activeStopIndex && unlockedByStop[index]) return "done";
      if (index === activeStopIndex) return "active";
      if (!unlockedByStop[index]) return "locked";
      return "upcoming";
    },
    [activeStopIndex, unlockedByStop]
  );

  const scrollToStop = useCallback(
    (index: number) => {
      const viewport = scrollViewportRef.current;
      const target = stopRefs.current[index];
      if (!viewport || !target) return;
      viewport.scrollTo({ top: target.offsetTop, behavior: prefersReducedMotion ? "auto" : "smooth" });
    },
    [prefersReducedMotion]
  );

  const clampScrollToUnlockedRange = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || clampingRef.current) return;

    const nextLockedIndex = maxUnlockedStopIndex + 1;
    if (nextLockedIndex >= STOPS_TOTAL) return;

    const nextLockedStop = stopRefs.current[nextLockedIndex];
    if (!nextLockedStop) return;

    const maxTop = Math.max(0, nextLockedStop.offsetTop - 8);
    if (viewport.scrollTop <= maxTop) return;

    clampingRef.current = true;
    viewport.scrollTop = maxTop;
    window.requestAnimationFrame(() => {
      clampingRef.current = false;
    });
  }, [maxUnlockedStopIndex]);

  useEffect(() => {
    clampScrollToUnlockedRange();
  }, [clampScrollToUnlockedRange]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = activeStopIndex;
        let bestRatio = 0;
        const newlyVisible: number[] = [];

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.stopIndex);
          if (Number.isNaN(index)) continue;
          newlyVisible.push(index);
          if (entry.intersectionRatio >= bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }

        if (newlyVisible.length) {
          setRevealedStops((current) => {
            let changed = false;
            const next = [...current];
            for (const index of newlyVisible) {
              if (!next[index]) {
                next[index] = true;
                changed = true;
              }
            }
            return changed ? next : current;
          });
        }

        if (bestRatio > 0 && bestIndex !== activeStopIndex) {
          setActiveStopIndex(bestIndex);
        }
      },
      { root: viewport, threshold: [0.45, 0.6, 0.75] }
    );

    for (const stop of stopRefs.current) {
      if (stop) observer.observe(stop);
    }

    return () => observer.disconnect();
  }, [activeStopIndex]);

  const handleViewportScroll = useCallback(() => {
    clampScrollToUnlockedRange();

    const viewport = scrollViewportRef.current;
    const firstStop = stopRefs.current[0];
    if (!viewport || !firstStop) return;

    const fallbackThreshold = Math.max(120, viewport.clientHeight * 0.38);
    const dynamicThreshold = Math.max(
      fallbackThreshold,
      Math.min(firstStop.offsetHeight * 0.35, viewport.clientHeight * 0.7)
    );
    const nextValue = viewport.scrollTop > dynamicThreshold;

    setHasLeftFirstStop((current) => (current === nextValue ? current : nextValue));
  }, [clampScrollToUnlockedRange]);

  const handleCompleteIntroReducedMotion = useCallback(() => {
    setIntroAnimationProgress(1);
    setIntroAnimationCompleted(true);
  }, []);

  const handleCompleteModelIntroReducedMotion = useCallback(() => {
    setModelIntroVideoEnded(true);
    setModelIntroVideoStarted(false);
  }, []);

  const handlePlayModelIntroVideo = useCallback(() => {
    const video = modelIntroVideoRef.current;
    if (!video || modelIntroVideoEnded) return;
    const play = video.play();
    if (play?.catch) {
      play.catch(() => {});
    }
    setModelIntroVideoStarted(true);
  }, [modelIntroVideoEnded]);

  const handleModelIntroVideoEnded = useCallback(() => {
    setModelIntroVideoStarted(false);
    setModelIntroVideoEnded(true);
  }, []);

  const handleStartAutodiagnostic = useCallback(() => {
    setConsentTouched(true);
    if (!consentValid) return;
    setAutodiagnosticStarted(true);
    window.setTimeout(() => scrollToStop(4), 80);
  }, [consentValid, scrollToStop]);

  const handleCompleteQuizPlaceholder = useCallback(() => {
    setQuizCompleted(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("quizCompleted", {
          detail: { source: "etapa-1-scroll", completedAt: Date.now() },
        })
      );
    }
    window.setTimeout(() => scrollToStop(5), 80);
  }, [scrollToStop]);

  const handleSaveIntention = useCallback(() => {
    setIntentionTouched(true);
    if (!intentionValid) return;
    setIntentionSaved(true);
    window.setTimeout(() => scrollToStop(7), 80);
  }, [intentionValid, scrollToStop]);

  const handlePlayTransitionVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || transitionVideoEnded) return;
    const play = video.play();
    if (play?.catch) {
      play.catch(() => {
        // Autoplay may be blocked; explicit button remains available.
      });
    }
    setTransitionVideoStarted(true);
  }, [transitionVideoEnded]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (activeStopIndex !== 7) return;
    if (transitionVideoEnded || transitionVideoStarted) return;
    const timer = window.setTimeout(() => {
      handlePlayTransitionVideo();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [activeStopIndex, handlePlayTransitionVideo, prefersReducedMotion, transitionVideoEnded, transitionVideoStarted]);

  const handleTransitionEnded = useCallback(() => {
    setTransitionVideoStarted(false);
    setTransitionVideoEnded(true);
  }, []);

  const handleCompleteTransitionReducedMotion = useCallback(() => {
    setTransitionVideoEnded(true);
  }, []);

  const goToEtapa2 = useCallback(() => {
    writeProgress({ lastRoute: "/etapa2" });
    router.push("/etapa2");
  }, [router]);

  return (
    <div className={styles.stage}>
      <TechTrailBackground className={styles.techBackground} />

      {introVideoOverlayOpen ? (
        <div className={styles.blockingVideoOverlay} role="dialog" aria-modal="true" aria-label="Presentación del modelo">
          <div className={styles.blockingVideoModal}>
            <AnimationFrameCard
              title="Presentación del modelo"
              description="Debes ver este video completo para continuar con la etapa 1."
              statusLabel={modelIntroVideoEnded ? "Vista" : "Pendiente"}
              completed={modelIntroVideoEnded}
              footer={
                <div className={styles.videoControls}>
                  {!prefersReducedMotion ? (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={handlePlayModelIntroVideo}
                      disabled={modelIntroVideoStarted}
                    >
                      {modelIntroVideoStarted ? "Reproduciendo..." : "Reproducir video"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={handleCompleteModelIntroReducedMotion}
                      disabled={!introReducedReady}
                    >
                      {introReducedReady ? "Confirmar visualización" : "Preparando vista..."}
                    </button>
                  )}
                </div>
              }
            >
              {prefersReducedMotion ? (
                <div className={styles.reducedMotionFallback}>
                  <div className={styles.reducedMotionFrame} />
                  <p>
                    Movimiento reducido activo. Confirma la visualización para continuar con el bloque inicial.
                  </p>
                </div>
              ) : (
                <video
                  ref={modelIntroVideoRef}
                  className={styles.transitionVideo}
                  src={MODEL_INTRO_VIDEO_URL}
                  playsInline
                  controls={false}
                  onEnded={handleModelIntroVideoEnded}
                  preload="metadata"
                />
              )}
            </AnimationFrameCard>
          </div>
        </div>
      ) : null}

      <aside
        className={`${styles.miniViewerDock} ${
          showDockedViewer ? styles.miniViewerDockVisible : styles.miniViewerDockHidden
        }`}
        aria-label="Estado de la espiral"
      >
        <div className={styles.viewerHeader}>
          <div>
            <p className={styles.viewerEyebrow}>Espiral de progreso</p>
            <h2 className={styles.viewerTitle}>Etapa 1</h2>
          </div>
          <span className={`${styles.viewerStatus} ${etapa1Completed ? styles.viewerStatusDone : styles.viewerStatusActive}`}>
            {etapa1Completed ? "Completada" : "Activa"}
          </span>
        </div>
        <div className={styles.viewerCanvasWrap}>
          <MiniSpiralViewer />
        </div>
        <div className={styles.viewerMeta}>
          <div className={styles.viewerMetaRow}>
            <span className={styles.viewerMetaKey}>Autodiagnóstico</span>
            <span className={styles.viewerMetaValue}>{quizCompleted ? "Listo" : "Pendiente"}</span>
          </div>
          <div className={styles.viewerMetaRow}>
            <span className={styles.viewerMetaKey}>Intención docente</span>
            <span className={styles.viewerMetaValue}>
              {intentionSaved ? "Guardada" : "Pendiente"}
            </span>
          </div>
        </div>
      </aside>

      <div
        ref={scrollViewportRef}
        className={`${styles.scrollViewport} ${
          introVideoOverlayOpen ? styles.scrollViewportLocked : ""
        }`}
        onScroll={handleViewportScroll}
        aria-label="Flujo de scroll de la etapa 1"
      >
        <div className={styles.scrollRail}>
          <StopShell
            index={0}
            title="Presentacion del modelo"
            subtitle="La etapa 1 inicia con la presentacion del modelo y la activacion de la esfera 1 en la espiral, este es tu punto de partida."
            registerStopRef={registerStopRef}
            state={getStopState(0)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[0]}
            surface="plain"
          >
            <div className={styles.copyBlock}>
              <p>Etapa 1 - Reconócete para avanzar.</p>
              <p>
                El modelo de proceso que vas a conocer está compuesto por seis
                etapas. En cada una de ellas, los docentes pueden encontrarse en
                distintos estados que reflejan su nivel actual de uso y
                apropiación de la IA en la educación.
              </p>
            </div>

            <CharacterStepDialog
              steps={laiaIntroSteps}
              size="compact"
              density="tight"
              className={styles.laiaInlineDialog}
            />

            <div className={styles.copyBlock}>
              <p>Etapas del modelo (visión general):</p>
            </div>
            <ul className={styles.stageNameList}>
              {stageNames.map((stageName) => (
                <li key={stageName}>{stageName}</li>
              ))}
            </ul>

            <div className={styles.heroSpiralPanel}>
              <div className={styles.heroSpiralHeader}>
                <span className={styles.heroSpiralLabel}>Vista inicial del modelo en espiral</span>
                <span className={styles.heroSpiralHint}>
                  Explóralo brevemente antes de pasar al panel lateral. Puedes usar el scroll para acercarte o alejarte, y también puedes girarlo a tu gusto.
                </span>
              </div>
              <div className={styles.heroSpiralCanvas}>
                <MiniSpiralViewer />
              </div>
            </div>

            <div className={styles.stateAnimBlock}>
              <div className={styles.stateAnimHeader}>
                <div>
                  <div className={styles.animationCardLabel}>Animación de estado</div>
                  <p className={styles.animationCardCopy}>
                  </p>
                </div>
                <span
                  className={`${styles.statusChip} ${
                    introAnimationCompleted ? styles.statusChipDone : ""
                  }`}
                >
                  {introAnimationCompleted ? "Vista" : "Pendiente"}
                </span>
              </div>

              <div className={styles.stageAnimationFrame} aria-live="polite">
                <div className={styles.stageAnimationGrid} />
                <div className={styles.stageAnimationSpine}>
                  {[0, 1, 2, 3, 4, 5].map((sphereIndex) => {
                    const localProgress = Math.max(
                      0,
                      Math.min(1, (introAnimationProgress - sphereIndex * 0.12) / 0.28)
                    );
                    const isActiveSphere = sphereIndex === 0;
                    const inlineStyle = {
                      ["--sphere-progress" as string]: isActiveSphere
                        ? introAnimationCompleted
                          ? 1
                          : localProgress
                        : 0.1,
                    } as CSSProperties;

                    return (
                      <div
                        key={sphereIndex}
                        className={`${styles.sphereNode} ${isActiveSphere ? styles.sphereNodePrimary : ""}`}
                        style={inlineStyle}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <div className={styles.stageAnimationCaption}>
                  {prefersReducedMotion && !introAnimationCompleted
                    ? "Movimiento reducido activo. Confirma para desbloquear el siguiente bloque."
                    : introAnimationCompleted
                      ? "Etapa 1 activa en la espiral."
                      : "Activando la visualización de estado de la etapa 1..."}
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.round((introAnimationCompleted ? 1 : introAnimationProgress) * 100)}%` }}
                  />
                </div>
                <p className={styles.microHint}>
                  Visualización inicial del estado en la espiral.
                </p>
              </div>

              <div className={styles.stateAnimFooter}>
                {!introStopCompleted && prefersReducedMotion ? (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleCompleteIntroReducedMotion}
                    disabled={!introReducedReady}
                  >
                    {introReducedReady ? "Continuar" : "Preparando vista..."}
                  </button>
                ) : introStopCompleted ? (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => scrollToStop(1)}
                  >
                    Ir al siguiente bloque
                  </button>
                ) : null}
              </div>
            </div>
          </StopShell>

          <StopShell
            index={1}
            title="Modelo en 6 etapas"
            subtitle="Visión corta del recorrido completo, sin saturar contenido."
            registerStopRef={registerStopRef}
            state={getStopState(1)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[1]}
            surface="plain"
          >
            <div className={styles.copyBlock}>
              <p>
                Estos estados no son etiquetas fijas ni juicios de valor, sino
                puntos de referencia para reconocer dónde estás hoy y qué camino
                puedes recorrer.
              </p>
              <p>
                Según tu estado, tu recorrido tendrá un ritmo y necesidades
                propias; el proceso es flexible, personal y adaptado a tu
                realidad.
              </p>
              <p>
                El modelo reconoce la diversidad entre docentes y asegura que
                cada uno pueda avanzar a su manera, con posibilidad de crecer y
                fortalecer su práctica con apoyo de la IA.
              </p>
            </div>

            <div className={styles.resultsPanel}>
              {stateSummaries.map((stateItem) => (
                <div key={stateItem.title} className={styles.resultDimsCard}>
                  <h3 className={styles.resultCardTitle}>{stateItem.title}</h3>
                  <p className={styles.stateCardCopy}>{stateItem.text}</p>
                </div>
              ))}
            </div>

            {showIntroLaiaHelp ? (
              <CharacterStepDialog
                steps={laiaStatesSteps}
                size="compact"
                density="tight"
                className={styles.laiaInlineDialog}
              />
            ) : null}

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setShowIntroLaiaHelp((current) => !current)}
            >
              {showIntroLaiaHelp ? "Ocultar apoyo de Laia" : "Ver explicación puntual con Laia"}
            </button>
          </StopShell>

          <StopShell
            index={2}
            title="Encuadre pedagógico"
            subtitle="Por qué el recorrido comienza con autodiagnóstico."
            registerStopRef={registerStopRef}
            state={getStopState(2)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[2]}
            surface="plain"
          >
            <CharacterStepDialog
              steps={laiaEncuadreSteps}
              size="compact"
              density="tight"
              className={styles.laiaInlineDialog}
            />

            <div className={styles.copyBlock}>
              <p>
                Estas etapas representan momentos del camino de integración de IA
                en la práctica educativa.
              </p>
              <p>
                No es un camino rígido ni lineal: la espiral permite avanzar de
                forma progresiva, ajustando, mejorando y creciendo con cada
                ciclo.
              </p>
              <p>
                Las etapas acompañan tu desarrollo y brindan claridad para que
                la IA sea una aliada pedagógica.
              </p>
            </div>

            <div className={styles.copyBlock}>
              <p>Factores rectores para orientar el recorrido:</p>
            </div>
            <ul className={styles.factorList}>
              {factorList.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </StopShell>

          <StopShell
            index={3}
            title="Confianza, condiciones y consentimiento"
            subtitle="Validación mínima antes de habilitar el autodiagnóstico."
            registerStopRef={registerStopRef}
            state={getStopState(3)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[3]}
            surface="plain"
          >
            <CharacterStepDialog
              steps={laiaConsentSteps}
              size="compact"
              density="tight"
              className={styles.laiaInlineDialog}
            />

            <div className={styles.copyBlock}>
              <p>Este ejercicio es individual, objetivo y confidencial.</p>
              <p>No tiene efectos administrativos. Su único propósito es orientar el camino formativo.</p>
            </div>

            <form className={styles.formCard} onSubmit={(event) => event.preventDefault()}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={consentAdmin}
                  onChange={(event) => setConsentAdmin(event.target.checked)}
                />
                <span>Entiendo que no es una evaluación administrativa</span>
              </label>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={consentUsage}
                  onChange={(event) => setConsentUsage(event.target.checked)}
                />
                <span>Acepto que mis respuestas se usen para generar mi resultado y recomendaciones</span>
              </label>

              <label className={styles.fieldLabel} htmlFor="etapa1-email">
                Correo para enviarte el resultado
              </label>
              <input
                id="etapa1-email"
                type="email"
                className={styles.textInput}
                placeholder="docente@uao.edu.co"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
              />

              {consentTouched && !consentValid ? (
                <p className={styles.errorText}>
                  Completa los dos consentimientos y escribe un correo válido para continuar.
                </p>
              ) : null}

              <div className={styles.formActions}>
                <button type="button" className={styles.primaryBtn} onClick={handleStartAutodiagnostic}>
                  Iniciar autodiagnóstico
                </button>
                <span className={styles.helperText}>
                  La siguiente sección se desbloquea solo con validación mínima.
                </span>
              </div>
            </form>
          </StopShell>

          <StopShell
            index={4}
            title="Autodiagnóstico embebido"
            subtitle="Contenedor para agente N8N / formulario. El asistente no interrumpe mientras respondes."
            registerStopRef={registerStopRef}
            state={getStopState(4)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[4]}
            surface="plain"
          >
            <div className={styles.embedCard}>
              <div className={styles.embedHeader}>
                <span className={styles.embedLabel}>Realiza el autodiagnóstico</span>
                <span className={styles.embedStatus}>{quizCompleted ? "Completado" : "En espera"}</span>
              </div>

              <div className={styles.embedViewport}>
                <div className={styles.embedPlaceholder}>
                  <p>Realiza el autodiagnóstico.</p>
                  <p className={styles.embedPlaceholderHint}>
                    Tu información será tratada de forma confidencial y usada
                    únicamente para orientar tu recorrido formativo.
                  </p>
                  <p className={styles.embedPlaceholderHint}>
                    Módulo en implementación.
                  </p>
                </div>
              </div>

              <div className={styles.embedActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setShowFormLaiaHelp((current) => !current)}
                >
                  Ayuda bajo demanda
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled
                >
                  Autodiagnóstico en implementación
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleCompleteQuizPlaceholder}
                >
                  {quizCompleted ? "Autodiagnóstico completado" : "Continuar con demostración"}
                </button>
              </div>

              {showFormLaiaHelp ? (
                <div className={styles.assistFootnote}>
                  Laia permanece en modo de ayuda. No se inyectan mensajes automáticos durante la respuesta del docente.
                </div>
              ) : null}
            </div>
          </StopShell>

          <StopShell
            index={5}
            title="Espacio reservado"
            subtitle="Sección temporalmente vacía para definir el siguiente contenido."
            registerStopRef={registerStopRef}
            state={getStopState(5)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[5]}
            surface="plain"
          >
            <CharacterStepDialog
              steps={laiaResultSteps}
              size="compact"
              density="tight"
              className={styles.laiaInlineDialog}
            />

            <div className={styles.resultsPanel}>
              <div className={styles.resultSummaryCard}>
                <h3 className={styles.resultCardTitle}>Estado de partida identificado</h3>
                <div className={styles.resultSummaryGrid}>
                  <div>
                    <span className={styles.metricLabel}>Estado</span>
                    <strong className={styles.metricValue}>Explorando con propósito (referencia de demostración)</strong>
                  </div>
                  <div>
                    <span className={styles.metricLabel}>Lectura pedagógica</span>
                    <strong className={styles.metricValue}>Hay base para consolidar usos educativos con intención.</strong>
                  </div>
                </div>
              </div>

              <div className={styles.resultDimsCard}>
                <h3 className={styles.resultCardTitle}>Estados posibles</h3>
                <ul className={styles.metricList}>
                  <li><span>Aprendiendo sin miedo</span><strong>Inicio</strong></li>
                  <li><span>Explorando con propósito</span><strong>Desarrollo</strong></li>
                  <li><span>Innovando e inspirando</span><strong>Proyección</strong></li>
                </ul>
              </div>

              <div className={styles.resultRecsCard}>
                <h3 className={styles.resultCardTitle}>Qué hacer con este resultado</h3>
                <ul className={styles.recommendationList}>
                  <li>Usarlo como referencia para decidir el ritmo del recorrido.</li>
                  <li>Priorizar acciones coherentes con tu contexto actual.</li>
                  <li>Tomar decisiones formativas con propósito pedagógico.</li>
                </ul>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => scrollToStop(6)}
              >
                Continuar al registro de intención
              </button>
            </div>
          </StopShell>

          <StopShell
            index={6}
            title="Registro de intención del docente"
            subtitle="Este paso hace parte del storyboard y debe completarse antes de continuar."
            registerStopRef={registerStopRef}
            state={getStopState(6)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[6]}
            surface="plain"
          >
            <CharacterStepDialog
              steps={laiaIntentionSteps}
              size="compact"
              density="tight"
              className={styles.laiaInlineDialog}
            />

            <div className={styles.copyBlock}>
              <p>
                Registrar tu intención ayuda a revisar, más adelante, cómo evolucionó tu experiencia a lo largo de la espiral.
              </p>
            </div>

            <form className={styles.formCard} onSubmit={(event) => event.preventDefault()}>
              <label className={styles.fieldLabel} htmlFor="etapa1-intencion">
                Mi intención para este recorrido es...
              </label>
              <input
                id="etapa1-intencion"
                type="text"
                className={styles.textInput}
                value={intentionText}
                onChange={(event) => setIntentionText(event.target.value)}
                placeholder="Ej.: Diseñar una actividad con GenAI alineada a mis resultados de aprendizaje"
                maxLength={180}
              />

              <label className={styles.fieldLabel} htmlFor="etapa1-emocion">
                Emoción con la que inicio (opcional)
              </label>
              <select
                id="etapa1-emocion"
                className={styles.selectInput}
                value={emotion}
                onChange={(event) => setEmotion(event.target.value)}
              >
                <option value="">Selecciona una opción</option>
                <option value="curiosidad">Curiosidad</option>
                <option value="expectativa">Expectativa</option>
                <option value="duda">Duda</option>
                <option value="entusiasmo">Entusiasmo</option>
                <option value="cautela">Cautela</option>
              </select>

              {intentionTouched && !intentionValid ? (
                <p className={styles.errorText}>
                  Escribe una intención breve para guardar este bloque.
                </p>
              ) : null}

              <div className={styles.formActions}>
                <button type="button" className={styles.primaryBtn} onClick={handleSaveIntention}>
                  {intentionSaved ? "Intención guardada" : "Guardar intención"}
                </button>
              </div>
            </form>
          </StopShell>

          <StopShell
            index={7}
            title="Cierre + Transición a Etapa 2"
            subtitle="Transición no-skipeable antes de habilitar la navegación hacia la siguiente etapa."
            registerStopRef={registerStopRef}
            state={getStopState(7)}
            activeIndex={activeStopIndex}
            revealed={revealedStops[7]}
            surface="plain"
          >
            <div className={styles.copyBlock}>
              <p>
                Con tu punto de partida identificado, el siguiente paso es explorar posibilidades reales de GenAI para fortalecer actividades concretas de aprendizaje.
              </p>
            </div>

            <CharacterStepDialog
              steps={laiaBridgeSteps}
              size="compact"
              density="tight"
              className={styles.laiaInlineDialog}
            />

            <AnimationFrameCard
              title="Transición Etapa 1 -> Etapa 2"
              description="Animación de transición del flujo. No se habilita la continuación hasta completar la visualización."
              statusLabel={transitionVideoEnded ? "Vista" : "Pendiente"}
              completed={transitionVideoEnded}
              footer={
                <div className={styles.videoControls}>
                  {!prefersReducedMotion && !transitionVideoEnded ? (
                    <button type="button" className={styles.secondaryBtn} onClick={handlePlayTransitionVideo}>
                      {transitionVideoStarted ? "Reproduciendo..." : "Reproducir"}
                    </button>
                  ) : null}

                  {prefersReducedMotion && !transitionVideoEnded ? (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={handleCompleteTransitionReducedMotion}
                      disabled={!transitionReducedReady}
                    >
                      {transitionReducedReady ? "Confirmar visualización" : "Preparando vista..."}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={goToEtapa2}
                    disabled={!transitionVideoEnded}
                  >
                    Continuar a Etapa 2
                  </button>
                </div>
              }
            >
              {prefersReducedMotion ? (
                <div className={styles.reducedMotionFallback}>
                  <div className={styles.reducedMotionFrame} />
                  <p>
                    Movimiento reducido activo. Se muestra una vista estática de la transición; confirma para continuar cuando se habilite la acción.
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className={styles.transitionVideo}
                  src={TRANSITION_VIDEO_URL}
                  playsInline
                  controls={false}
                  onEnded={handleTransitionEnded}
                  preload="metadata"
                />
              )}
            </AnimationFrameCard>
          </StopShell>
        </div>
      </div>
    </div>
  );
}
