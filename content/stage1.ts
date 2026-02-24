import type { RailPanel, SectionNode, StateCardItem } from "@/types/stage";

export const STAGE1_NAME = "Reconócete para avanzar";

export const ALL_STAGE_NAMES = [
  "Reconócete para avanzar",
  "Descubre nuevas posibilidades",
  "Diseña con propósito",
  "Prepara el terreno para el éxito",
  "Hazlo realidad en el aula",
  "Reflexiona, aprende y mejora",
] as const;

export const STATE_CARDS: StateCardItem[] = [
  {
    hierarchy: "Inicial",
    title: "Aprendiendo sin miedo",
    description: "Primeras aproximaciones con curiosidad y necesidad de guía clara.",
    supportHint: "Recibirás apoyo más guiado, ejemplos listos para adaptar y recomendaciones paso a paso.",
  },
  {
    hierarchy: "Intermedio",
    title: "Explorando con propósito",
    description: "Ya experimentas con intención educativa y buscas mayor coherencia pedagógica.",
    supportHint: "Recibirás recomendaciones para fortalecer decisiones didácticas, críticas y éticas.",
  },
  {
    hierarchy: "Avanzado",
    title: "Innovando e inspirando",
    description: "Integras GenAI de forma crítica, creativa y estratégica en distintos contextos.",
    supportHint: "Recibirás retos de mayor profundidad y oportunidades para compartir aprendizajes.",
  },
];

export const FACTORS = [
  "F1 Propósito — “¿Qué actividad transformar con sentido pedagógico?”",
  "F2 Razonamiento crítico — “¿Qué proceso cognitivo/razonamiento crítico debe hacer el estudiante?”",
  "F3 Ética — “¿Qué consideraciones éticas y de responsabilidad hay?”",
  "F4 Herramientas — “¿Qué herramientas se incorporan?”",
  "F5 Reflexión — “¿Qué se aprende y mejora del proceso?”",
];

export const RAIL_PANELS: RailPanel[] = [
  {
    id: "intro",
    kind: "intro",
    label: "Introducción",
    title: "Recorrido del modelo",
    lines: [
      "Desliza hacia abajo para recorrer las 6 etapas del modelo.",
      "No es un camino rígido: puedes avanzar a tu ritmo y volver cuando lo necesites.",
    ],
  },
  {
    id: "etapa-1",
    label: "Etapa 1",
    title: "Reconócete para avanzar",
    lines: [
      "Identifica tu punto de partida con un ejercicio individual y confidencial.",
      "No es un examen: orienta tu ruta.",
    ],
  },
  {
    id: "etapa-2",
    label: "Etapa 2",
    title: "Descubre nuevas posibilidades",
    lines: [
      "Explora herramientas y usos educativos de GenAI.",
      "Reconoce beneficios, límites e implicaciones éticas.",
    ],
  },
  {
    id: "etapa-3",
    label: "Etapa 3",
    title: "Diseña con propósito",
    lines: [
      "Planifica una experiencia con IA justificada pedagógicamente.",
      "Define objetivos, actividades y evaluación.",
    ],
  },
  {
    id: "etapa-4",
    label: "Etapa 4",
    title: "Prepara el terreno para el éxito",
    lines: [
      "Alista herramientas, condiciones y acompañamiento.",
      "Busca una implementación sólida y segura.",
    ],
  },
  {
    id: "etapa-5",
    label: "Etapa 5",
    title: "Hazlo realidad en el aula",
    lines: [
      "Implementa la experiencia y guía a tus estudiantes.",
      "Gestiona recursos y documenta el proceso.",
    ],
  },
  {
    id: "etapa-6",
    label: "Etapa 6",
    title: "Reflexiona, aprende y mejora",
    lines: [
      "Evalúa logros y dificultades para ajustar el siguiente ciclo.",
      "Mejora de forma continua.",
    ],
  },
];

const LAIA = {
  neutral: "/ui/laia.png",
  explain: "/ui/laia_explaining.png",
  holo: "/ui/laia_explaining_holo.png",
  triumphant: "/ui/laia_triumphant.png",
  confused: "/ui/laia_confused.png",
} as const;

export const STAGE1_TREE: SectionNode[] = [
  {
    id: "modelo-resumen",
    title: "Resumen del modelo",
    subtitle: "Recorrido general de las etapas antes del autodiagnóstico.",
    surface: "plain",
    dialogue: [
      {
        text: "Este recorrido acompaña la integración responsable de GenAI en experiencias de aprendizaje. Avanzarás por etapas conectadas, de forma progresiva y reflexiva.",
        imgSrc: LAIA.neutral,
        imgAlt: "Laia introduce el recorrido",
      },
      {
        text: "Desliza hacia abajo para recorrer cada etapa.",
        imgSrc: LAIA.explain,
        imgAlt: "Laia invita a recorrer las etapas",
      },
    ],
    content: [{ type: "horizontal-rail", panels: RAIL_PANELS }],
    children: [
      {
        id: "animacion-estado",
        title: "Activación del estado de Etapa 1",
        subtitle: "La animación debe verse completa antes de avanzar al resto de la etapa.",
        surface: "plain",
        content: [{ type: "stage1-animation" }],
        gate: { completionFlag: "stage1AnimationViewed" },
        children: [
          {
            id: "estados",
            title: "Estados del recorrido",
            subtitle: "Jerarquía y efecto en el flujo de acompañamiento.",
            surface: "plain",
            dialogue: [
              {
                text: "Los estados no son etiquetas ni juicios; solo ajustan recomendaciones y apoyos para acompañarte mejor.",
                imgSrc: LAIA.explain,
                imgAlt: "Laia aclara el uso de los estados",
              },
            ],
            gate: { requires: ["stage1AnimationViewed"] },
            content: [
              {
                type: "paragraphs",
                paragraphs: [
                  "No son etiquetas ni juicios.",
                  "No bloquea contenido: ajusta ritmo, ayuda y recomendaciones.",
                ],
              },
              { type: "state-cards", items: STATE_CARDS },
            ],
            children: [
              {
                id: "encuadre",
                title: "Encuadre de la Etapa 1",
                subtitle: "Por qué el recorrido inicia con autodiagnóstico y cómo se orienta la experiencia.",
                surface: "plain",
                dialogue: [
                  {
                    text: "Antes de explorar herramientas o diseñar actividades, conviene reconocer desde dónde se empieza. Esta etapa propone un autodiagnóstico para orientar el recorrido.",
                    imgSrc: LAIA.explain,
                    imgAlt: "Laia encuadra la etapa 1",
                  },
                ],
                gate: { requires: ["stage1AnimationViewed"] },
                content: [
                  {
                    type: "paragraphs",
                    paragraphs: [
                      "El recorrido avanza por etapas conectadas y puede recorrerse de forma progresiva, volviendo cuando sea necesario.",
                      "Los factores rectores ayudan a tomar decisiones formativas coherentes sin convertir el proceso en un examen.",
                    ],
                  },
                  { type: "bullets", title: "Factores del modelo", items: FACTORS },
                ],
                children: [
                  {
                    id: "consentimiento",
                    title: "Confianza y consentimiento",
                    subtitle: "Validación mínima antes de habilitar el autodiagnóstico.",
                    surface: "plain",
                    dialogue: [
                      {
                        text: "Este ejercicio es individual, objetivo y confidencial. No tiene efectos administrativos. Su único propósito es orientar el camino formativo.",
                        imgSrc: LAIA.explain,
                        imgAlt: "Laia explica confidencialidad",
                      },
                    ],
                    content: [{ type: "consent-form" }],
                    children: [
                      {
                        id: "autodiagnostico",
                        title: "Autodiagnóstico",
                        subtitle: "Completa el módulo para identificar tu punto de partida.",
                        surface: "plain",
                        gate: { requires: ["consentValidated", "autodiagnosticStarted"] },
                        content: [{ type: "autodiagnostic-module" }],
                        children: [
                          {
                            id: "resultado",
                            title: "Resultado",
                            subtitle: "Lectura de tu punto de partida y recomendaciones iniciales.",
                            surface: "plain",
                            gate: { requires: ["autodiagnosticCompleted"] },
                            dialogue: [
                              {
                                text: "Este resultado no define capacidades; orienta condiciones de partida. El valor está en tomar decisiones formativas más coherentes.",
                                imgSrc: LAIA.explain,
                                imgAlt: "Laia presenta el resultado",
                              },
                            ],
                            content: [{ type: "result-summary" }],
                            children: [
                              {
                                id: "intencion",
                                title: "Intención personal",
                                subtitle: "Registro breve para acompañar tu recorrido.",
                                surface: "plain",
                                gate: { requires: ["autodiagnosticCompleted"] },
                                dialogue: [
                                  {
                                    text: "Registrar tu intención ayuda a revisar, más adelante, cómo evolucionó tu experiencia a lo largo de la espiral.",
                                    imgSrc: LAIA.explain,
                                    imgAlt: "Laia invita a registrar intención",
                                  },
                                ],
                                content: [{ type: "intention-form" }],
                                children: [
                                  {
                                    id: "transicion-etapa-2",
                                    title: "Transición a la Etapa 2",
                                    subtitle: "Visualiza la transición completa para habilitar el avance.",
                                    surface: "plain",
                                    gate: { requires: ["intentionSaved"] },
                                    dialogue: [
                                      {
                                        text: "Con tu punto de partida identificado, el siguiente paso es explorar posibilidades reales de GenAI para fortalecer actividades concretas de aprendizaje.",
                                        imgSrc: LAIA.explain,
                                        imgAlt: "Laia enlaza con la etapa 2",
                                      },
                                    ],
                                    content: [{ type: "transition-animation" }],
                                    actions: [
                                      {
                                        type: "navigate",
                                        label: "Continuar a Etapa 2",
                                        href: "/etapa2",
                                        variant: "primary",
                                        requires: ["transitionAnimationViewed"],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
