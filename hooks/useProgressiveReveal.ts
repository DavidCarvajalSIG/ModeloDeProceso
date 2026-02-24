"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseProgressiveRevealOptions = {
  ids: string[];
  threshold?: number;
  rootMargin?: string;
};

export function useProgressiveReveal({
  ids,
  threshold = 0.25,
  rootMargin = "0px 0px -12% 0px",
}: UseProgressiveRevealOptions) {
  const refs = useRef(new Map<string, HTMLElement>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ratiosRef = useRef(new Map<string, number>());
  const lastActiveIdRef = useRef<string>(ids[0] ?? "");
  const [revealedSet, setRevealedSet] = useState<Set<string>>(
    () => new Set(ids.slice(0, 1))
  );
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    setRevealedSet(new Set(ids.slice(0, 1)));
    setActiveId(ids[0] ?? "");
    ratiosRef.current.clear();
    lastActiveIdRef.current = ids[0] ?? "";
  }, [ids]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const node = entry.target as HTMLElement;
          const id = node.dataset.sectionId;
          if (!id) continue;
          ratiosRef.current.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        setRevealedSet((current) => {
          let changed = false;
          const next = new Set(current);

          for (const entry of entries) {
            const node = entry.target as HTMLElement;
            const id = node.dataset.sectionId;
            if (!id) continue;

            if (entry.isIntersecting) {
              if (!next.has(id)) {
                next.add(id);
                changed = true;
              }
            }
          }

          // Evita estados vacíos transitorios (frecuentes con secciones sticky/pin)
          // donde salen entradas antes de que llegue la siguiente entrada del observer.
          if (next.size === 0) {
            const fallbackId = lastActiveIdRef.current || ids[0];
            if (fallbackId) {
              next.add(fallbackId);
              changed = true;
            }
          }

          return changed ? next : current;
        });

        let nextActiveId = "";
        let nextActiveRatio = 0;
        for (const id of ids) {
          const ratio = ratiosRef.current.get(id) ?? 0;
          if (ratio > nextActiveRatio) {
            nextActiveRatio = ratio;
            nextActiveId = id;
          }
        }

        if (nextActiveId) {
          lastActiveIdRef.current = nextActiveId;
          setActiveId(nextActiveId);
        }
      },
      {
        threshold: [threshold, 0.45, 0.7],
        rootMargin,
      }
    );
    observerRef.current = observer;

    const nodes = Array.from(refs.current.values());
    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [ids, rootMargin, threshold]);

  const registerSectionRef = useCallback((id: string, node: HTMLElement | null) => {
    const previous = refs.current.get(id);
    if (previous && observerRef.current) {
      observerRef.current.unobserve(previous);
    }

    if (!node) {
      refs.current.delete(id);
      return;
    }

    node.dataset.sectionId = id;
    refs.current.set(id, node);

    if (observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  const revealed = useMemo(() => revealedSet, [revealedSet]);

  return { activeId, revealed, registerSectionRef };
}
