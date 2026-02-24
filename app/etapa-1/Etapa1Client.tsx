"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AnimationCard from "@/components/stage/AnimationCard";
import DialogueBlock from "@/components/stage/DialogueBlock";
import HorizontalScrollRail from "@/components/stage/HorizontalScrollRail";
import ProgressiveSection from "@/components/stage/ProgressiveSection";
import StageShell from "@/components/stage/StageShell";
import stageStyles from "@/components/stage/stage.module.css";
import {
  STAGE1_NAME,
  STAGE1_TREE,
  STATE_CARDS,
} from "@/content/stage1";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import { useStageProgress } from "@/hooks/useStageProgress";
import { writeProgress } from "@/lib/progress";
import { isEmailValid, isRequired } from "@/lib/validation";
import type { SectionAction, SectionContentBlock, SectionNode, StageFlagKey } from "@/types/stage";
import styles from "./etapa1.module.css";

const MODEL_INTRO_VIDEO_URL = "/videos/intro-modelo.mp4";
const TRANSITION_VIDEO_URL = "/videos/TransicionE1-a-E2.mp4";
const AUTODIAGNOSTIC_FORM_URL =
  "https://n8n.srv1196015.hstgr.cloud/form/b2eb09c5-2438-46e7-a786-fe280e7db75f";

function flattenSectionIds(nodes: SectionNode[]): string[] {
  const ids: string[] = [];

  const walk = (items: SectionNode[]) => {
    for (const item of items) {
      ids.push(item.id);
      if (item.children?.length) walk(item.children);
    }
  };

  walk(nodes);
  return ids;
}

function hasRequiredFlags(
  flags: Record<StageFlagKey, boolean>,
  requires?: StageFlagKey[]
) {
  if (!requires?.length) return true;
  return requires.every((flag) => flags[flag]);
}

function getResultStateCard(resultId: string) {
  const byId = {
    inicial: STATE_CARDS[0],
    intermedio: STATE_CARDS[1],
    avanzado: STATE_CARDS[2],
  } as const;

  return byId[resultId as keyof typeof byId] ?? STATE_CARDS[1];
}

function getResultRecommendations(resultId: string) {
  if (resultId === "inicial") {
    return [
      "Prioriza una actividad concreta y pequeña para iniciar con claridad.",
      "Usa ejemplos guiados antes de diseñar variaciones propias.",
      "Revisa siempre el propósito pedagógico antes de elegir herramientas.",
    ];
  }

  if (resultId === "avanzado") {
    return [
      "Diseña experiencias con mayor autonomía estudiantil y criterios explícitos.",
      "Profundiza en evaluación, trazabilidad y consideraciones éticas del uso de GenAI.",
      "Documenta aprendizajes para compartir prácticas con colegas.",
    ];
  }

  return [
    "Consolida usos educativos con intención pedagógica y criterios claros.",
    "Fortalece el razonamiento crítico y la ética dentro de actividades concretas.",
    "Avanza con iteraciones breves y registra lo que funciona para mejorar el siguiente ciclo.",
  ];
}

export default function Etapa1Client() {
  const router = useRouter();
  const { state, update, flags } = useStageProgress();
  const [consentTouched, setConsentTouched] = useState(false);
  const [intentionTouched, setIntentionTouched] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showModuleFallback, setShowModuleFallback] = useState(false);

  const allSectionIds = useMemo(() => flattenSectionIds(STAGE1_TREE), []);
  const { activeId, revealed, registerSectionRef } = useProgressiveReveal({
    ids: allSectionIds,
    threshold: 0.14,
    rootMargin: "0px 0px -18% 0px",
  });

  const consentValid =
    state.consentAdmin && state.consentUsage && isEmailValid(state.email) && flags.stage1AnimationViewed;
  const intentionValid = isRequired(state.intentionText);
  const selectedResultCard = getResultStateCard(state.resultStateId);
  const resultRecommendations = getResultRecommendations(state.resultStateId);

  useEffect(() => {
    writeProgress({ hasStarted: true, lastRoute: "/etapa-1" });
  }, []);

  useEffect(() => {
    if (!state.autodiagnosticStarted || iframeLoaded) return;
    const timer = window.setTimeout(() => setShowModuleFallback(true), 4500);
    return () => window.clearTimeout(timer);
  }, [iframeLoaded, state.autodiagnosticStarted]);

  const viewerStatus = flags.transitionAnimationViewed
    ? { label: "Lista para Etapa 2", tone: "done" as const }
    : { label: "Etapa 1 activa", tone: "active" as const };

  const viewerMeta = [
    { label: "Etapa", value: STAGE1_NAME },
    { label: "Estado", value: selectedResultCard.title },
    {
      label: "Avance",
      value: `${[
        flags.stage1AnimationViewed,
        flags.consentValidated,
        flags.autodiagnosticCompleted,
        flags.intentionSaved,
        flags.transitionAnimationViewed,
      ].filter(Boolean).length}/5 hitos`,
    },
  ];

  const canRenderNode = (node: SectionNode) => hasRequiredFlags(flags, node.gate?.requires);

  const visibleIndexById = useMemo(() => {
    const orderedIds: string[] = [];
    const walk = (nodes: SectionNode[]) => {
      for (const node of nodes) {
        if (!hasRequiredFlags(flags, node.gate?.requires)) continue;
        orderedIds.push(node.id);
        if (node.children?.length) walk(node.children);
      }
    };
    walk(STAGE1_TREE);
    return new Map(orderedIds.map((id, index) => [id, index + 1] as const));
  }, [flags]);

  const goToRoute = (href: string) => {
    writeProgress({ lastRoute: href });
    router.push(href);
  };

  const scrollToId = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderActions = (actions: SectionAction[] | undefined) => {
    if (!actions?.length) return null;

    return (
      <div className={stageStyles.buttonRow}>
        {actions.map((action) => {
          const variant = action.variant ?? "secondary";
          const className =
            variant === "primary" ? stageStyles.buttonPrimary : stageStyles.buttonSecondary;

          if (action.type === "scroll-to") {
            return (
              <button
                key={`${action.type}:${action.targetId}:${action.label}`}
                type="button"
                className={className}
                onClick={() => scrollToId(action.targetId)}
              >
                {action.label}
              </button>
            );
          }

          const enabled = hasRequiredFlags(flags, action.requires);
          return (
            <button
              key={`${action.type}:${action.href}:${action.label}`}
              type="button"
              className={className}
              disabled={!enabled}
              onClick={() => goToRoute(action.href)}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderContentBlock = (block: SectionContentBlock, section: SectionNode): ReactNode => {
    switch (block.type) {
      case "paragraphs":
        return (
          <div className={styles.stageCopy} key={`${section.id}-paragraphs`}>
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        );

      case "callout":
        return (
          <div className={styles.callout} key={`${section.id}-callout-${block.body}`}>
            {block.title ? <h3 className={styles.calloutTitle}>{block.title}</h3> : null}
            <p className={styles.calloutBody}>{block.body}</p>
          </div>
        );

      case "bullets":
        return (
          <div className={styles.bulletBlock} key={`${section.id}-bullets`}>
            {block.title ? <h3 className={styles.bulletTitle}>{block.title}</h3> : null}
            <ul className={styles.bulletList}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        );

      case "horizontal-rail":
        return <HorizontalScrollRail key={`${section.id}-rail`} panels={block.panels} />;

      case "state-cards":
        return (
          <div className={styles.stateGrid} key={`${section.id}-states`}>
            {block.items.map((item) => (
              <article key={item.title} className={styles.stateCard}>
                <span className={styles.stateHierarchy}>{item.hierarchy}</span>
                <h3 className={styles.stateTitle}>{item.title}</h3>
                <p className={styles.stateDesc}>{item.description}</p>
                <p className={styles.stateHint}>{item.supportHint}</p>
              </article>
            ))}
          </div>
        );

      case "stage1-animation":
        return (
          <AnimationCard
            key={`${section.id}-anim`}
            title="Animación de estado de Etapa 1"
            description=""
            videoSrc={MODEL_INTRO_VIDEO_URL}
            completed={flags.stage1AnimationViewed}
            onPlayStart={() => update({ stage1AnimationStarted: true })}
            onComplete={() => update({ stage1AnimationViewed: true })}
            autoplayOnVisible={false}
            blockAdvanceUntilComplete
            blockedAdvanceMessage="Para continuar con la etapa, primero debes reproducir y completar esta animación. Hasta entonces no se habilita el resto del contenido."
          />
        );

      case "consent-form":
        return (
          <form
            key={`${section.id}-consent`}
            className={styles.formCard}
            onSubmit={(event) => event.preventDefault()}
          >
            <div className={styles.stageCopy}>
              <p>Este ejercicio es individual, objetivo y confidencial.</p>
              <p>No tiene efectos administrativos. Su único propósito es orientar el camino formativo.</p>
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={state.consentAdmin}
                onChange={(event) => update({ consentAdmin: event.target.checked })}
              />
              <span>Entiendo que no es una evaluación administrativa.</span>
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={state.consentUsage}
                onChange={(event) => update({ consentUsage: event.target.checked })}
              />
              <span>Acepto que mis respuestas se usen para generar mi resultado y recomendaciones.</span>
            </label>

            <label className={styles.fieldLabel} htmlFor="stage1-email">
              Correo para enviarte el resultado
            </label>
            <input
              id="stage1-email"
              type="email"
              className={styles.textInput}
              placeholder="docente@uao.edu.co"
              value={state.email}
              onChange={(event) => update({ email: event.target.value })}
              autoComplete="email"
            />

            {consentTouched && !consentValid ? (
              <p className={styles.errorText}>
                Completa los dos consentimientos, una dirección de correo válida y la animación inicial para continuar.
              </p>
            ) : null}

            <div className={styles.actionRow}>
              <button
                type="button"
                className={stageStyles.buttonPrimary}
                onClick={() => {
                  setConsentTouched(true);
                  if (!consentValid) return;
                  update({ autodiagnosticStarted: true });
                  window.setTimeout(() => scrollToId("autodiagnostico"), 120);
                }}
              >
                Iniciar autodiagnóstico
              </button>
            </div>

            <p className={styles.helperText}>
              Este paso habilita el módulo de autodiagnóstico y mantiene la experiencia confidencial.
            </p>
          </form>
        );

      case "autodiagnostic-module":
        return (
          <div className={styles.embedCard} key={`${section.id}-autodiag`}>
            <div className={styles.embedHeader}>
              <span className={styles.embedLabel}>Autodiagnóstico</span>
              <span className={styles.embedStatus}>
                {state.autodiagnosticCompleted ? "Completado" : "Pendiente"}
              </span>
            </div>

            <div className={styles.embedViewport}>
              {!showModuleFallback || iframeLoaded ? (
                <iframe
                  src={AUTODIAGNOSTIC_FORM_URL}
                  title="Autodiagnóstico etapa 1"
                  className={styles.embedIframe}
                  loading="lazy"
                  onLoad={() => {
                    setIframeLoaded(true);
                    setShowModuleFallback(false);
                  }}
                />
              ) : (
                <div className={styles.embedFallback}>
                  <h3 className={styles.embedFallbackTitle}>Módulo en implementación</h3>
                  <p className={styles.embedFallbackCopy}>
                    Puedes continuar con el recorrido usando la simulación de resultado disponible en esta etapa.
                  </p>
                  <p className={styles.embedFallbackCopy}>
                    Cuando el módulo esté disponible, podrás completar aquí tu autodiagnóstico individual y confidencial.
                  </p>
                </div>
              )}
            </div>

            <div className={styles.embedActions}>
              <button
                type="button"
                className={stageStyles.buttonSecondary}
                disabled={state.autodiagnosticCompleted}
                onClick={() => {
                  update({ autodiagnosticCompleted: true, resultStateId: state.resultStateId || "intermedio" });
                  window.setTimeout(() => scrollToId("resultado"), 120);
                }}
              >
                {state.autodiagnosticCompleted
                  ? "Autodiagnóstico completado"
                  : "He completado el autodiagnóstico"}
              </button>
            </div>

            <p className={styles.helperText}>
              Durante este paso la navegación queda libre, y el acompañamiento de Laia se retoma al presentar el resultado.
            </p>
          </div>
        );

      case "result-summary":
        return (
          <div className={styles.resultGrid} key={`${section.id}-result`}>
            <section className={`${styles.resultCard} ${styles.resultCardWide}`}>
              <h3>Estado de partida identificado</h3>
              <span className={styles.pill}>
                {selectedResultCard.hierarchy} — {selectedResultCard.title}
              </span>
              <div className={styles.metricGrid}>
                <div>
                  <span className={styles.metricLabel}>Lectura inicial</span>
                  <div className={styles.metricValue}>{selectedResultCard.description}</div>
                </div>
                <div>
                  <span className={styles.metricLabel}>Cómo afecta el recorrido</span>
                  <div className={styles.metricValue}>
                    Ajusta ritmo sugerido, ayudas y recomendaciones, sin bloquear contenido.
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.resultCard}>
              <h3>Estados posibles</h3>
              <ul className={styles.listStack}>
                {STATE_CARDS.map((item) => (
                  <li key={item.title}>
                    {item.hierarchy} — {item.title}
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.resultCard}>
              <h3>Recomendaciones iniciales</h3>
              <ul className={styles.listStack}>
                {resultRecommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        );

      case "intention-form":
        return (
          <form
            key={`${section.id}-intention`}
            className={styles.formCard}
            onSubmit={(event) => event.preventDefault()}
          >
            <div className={styles.intentGrid}>
              <label className={styles.fieldLabel} htmlFor="stage1-intention">
                Mi intención para este recorrido es…
              </label>
              <textarea
                id="stage1-intention"
                className={styles.textArea}
                value={state.intentionText}
                onChange={(event) =>
                  update({ intentionText: event.target.value, intentionSaved: false })
                }
                placeholder="Ej.: Diseñar una actividad concreta con GenAI alineada a mis objetivos de aprendizaje"
                maxLength={280}
              />

              <label className={styles.fieldLabel} htmlFor="stage1-emotion">
                Emoción con la que inicio (opcional)
              </label>
              <select
                id="stage1-emotion"
                className={styles.selectInput}
                value={state.emotion}
                onChange={(event) => update({ emotion: event.target.value, intentionSaved: false })}
              >
                <option value="">Selecciona una opción</option>
                <option value="curiosidad">Curiosidad</option>
                <option value="expectativa">Expectativa</option>
                <option value="duda">Duda</option>
                <option value="entusiasmo">Entusiasmo</option>
                <option value="cautela">Cautela</option>
              </select>
            </div>

            {intentionTouched && !intentionValid ? (
              <p className={styles.errorText}>Escribe una intención breve para continuar.</p>
            ) : null}

            <div className={styles.actionRow}>
              <button
                type="button"
                className={stageStyles.buttonPrimary}
                onClick={() => {
                  setIntentionTouched(true);
                  if (!intentionValid) return;
                  update({ intentionSaved: true });
                  window.setTimeout(() => scrollToId("transicion-etapa-2"), 120);
                }}
              >
                {state.intentionSaved ? "Intención guardada" : "Guardar intención"}
              </button>
            </div>

            <p className={styles.helperText}>
              Este registro se conserva localmente para acompañar tu recorrido en esta experiencia.
            </p>
          </form>
        );

      case "transition-animation":
        return (
          <AnimationCard
            key={`${section.id}-transition`}
            title="Transición Etapa 1 -> Etapa 2"
            description=""
            videoSrc={TRANSITION_VIDEO_URL}
            completed={flags.transitionAnimationViewed}
            onComplete={() => update({ transitionAnimationViewed: true })}
            autoplayOnVisible={false}
          />
        );

      case "custom":
        return null;

      default:
        return null;
    }
  };

  const renderSectionNode = (node: SectionNode): ReactNode => {
    if (!canRenderNode(node)) return null;

    const currentIndex = visibleIndexById.get(node.id) ?? 0;
    const isActive = activeId === node.id;
    const isRevealed = revealed.has(node.id);

    return (
      <Fragment key={node.id}>
        <ProgressiveSection
          id={node.id}
          title={node.title}
          subtitle={node.subtitle}
          active={isActive}
          revealed={isRevealed}
          registerRef={registerSectionRef}
          indexLabel={`Sección ${currentIndex}`}
          surface={node.surface ?? "plain"}
        >
          {node.dialogue?.length ? <DialogueBlock steps={node.dialogue} /> : null}
          {node.content.map((block) => renderContentBlock(block, node))}
          {renderActions(node.actions)}
        </ProgressiveSection>

        {node.children?.map((child) => renderSectionNode(child))}
      </Fragment>
    );
  };

  return (
    <StageShell
      viewerTitle={STAGE1_NAME}
      viewerStatusLabel={viewerStatus.label}
      viewerStatusTone={viewerStatus.tone}
      viewerMeta={viewerMeta}
      viewerEnabled={state.stage1AnimationStarted || flags.stage1AnimationViewed}
    >
      {STAGE1_TREE.map((node) => renderSectionNode(node))}
    </StageShell>
  );
}
