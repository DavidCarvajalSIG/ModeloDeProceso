"use client";

import { useEffect, useRef } from "react";
import styles from "./TechTrailBackground.module.css";

type TechTrailBackgroundProps = {
  className?: string;
  trailDurationMs?: number;
  backgroundImageSrc?: string;
  backgroundImageOpacity?: number;
  backgroundImagePosition?: string;
};

type TrailPoint = {
  x: number;
  y: number;
  time: number;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  lifeMs: number;
};

const MAX_TRAIL_POINTS = 96;
const MAX_SPARKS = 80;

export default function TechTrailBackground({
  className,
  trailDurationMs = 920,
  backgroundImageSrc,
  backgroundImageOpacity = 0.34,
  backgroundImagePosition = "center",
}: TechTrailBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasBackgroundImage = Boolean(backgroundImageSrc?.trim());
  const safeImageOpacity = Math.min(1, Math.max(0, backgroundImageOpacity));

  useEffect(() => {
    const canvasMaybe = canvasRef.current;
    if (!canvasMaybe) return;

    const contextMaybe = canvasMaybe.getContext("2d");
    if (!contextMaybe) return;

    const canvas: HTMLCanvasElement = canvasMaybe;
    const context: CanvasRenderingContext2D = contextMaybe;

    const pointer = {
      x: 0,
      y: 0,
      active: false,
    };

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let points: TrailPoint[] = [];
    let sparks: Spark[] = [];

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pushTrailPoint(x: number, y: number, now: number) {
      const last = points[points.length - 1];
      if (last && Math.hypot(last.x - x, last.y - y) < 3) return;

      points.push({ x, y, time: now });
      if (points.length > MAX_TRAIL_POINTS) {
        points = points.slice(points.length - MAX_TRAIL_POINTS);
      }

      if (prefersReducedMotion) return;

      const speed = last ? Math.hypot(x - last.x, y - last.y) : 0;
      const sparkCount = speed > 25 ? 3 : 2;
      for (let i = 0; i < sparkCount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 0.25 + Math.random() * 0.9;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          bornAt: now,
          lifeMs: 420 + Math.random() * 280,
        });
      }

      if (sparks.length > MAX_SPARKS) {
        sparks = sparks.slice(sparks.length - MAX_SPARKS);
      }
    }

    function onMouseMove(event: MouseEvent) {
      const now = performance.now();
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      pushTrailPoint(pointer.x, pointer.y, now);
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;
      const now = performance.now();
      pointer.x = touch.clientX;
      pointer.y = touch.clientY;
      pointer.active = true;
      pushTrailPoint(pointer.x, pointer.y, now);
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function drawBase(time: number) {
      if (hasBackgroundImage) {
        // With custom image, keep only a subtle mask so the image remains the base.
        context.clearRect(0, 0, width, height);
        const mask = context.createLinearGradient(0, 0, 0, height);
        mask.addColorStop(0, "rgba(2, 8, 18, 0.34)");
        mask.addColorStop(0.52, "rgba(1, 6, 16, 0.24)");
        mask.addColorStop(1, "rgba(1, 5, 12, 0.38)");
        context.fillStyle = mask;
        context.fillRect(0, 0, width, height);
      } else {
        const gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "rgba(5, 11, 25, 0.99)");
        gradient.addColorStop(0.5, "rgba(3, 8, 19, 0.985)");
        gradient.addColorStop(1, "rgba(2, 6, 14, 0.995)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        const redGlow = context.createRadialGradient(
          width * 0.2,
          height * 0.16,
          40,
          width * 0.2,
          height * 0.16,
          Math.max(width, height) * 0.75
        );
        redGlow.addColorStop(0, "rgba(248, 46, 53, 0.14)");
        redGlow.addColorStop(0.6, "rgba(248, 46, 53, 0.05)");
        redGlow.addColorStop(1, "rgba(248, 46, 53, 0)");
        context.fillStyle = redGlow;
        context.fillRect(0, 0, width, height);

        const crimsonGlow = context.createRadialGradient(
          width * 0.83,
          height * 0.88,
          40,
          width * 0.83,
          height * 0.88,
          Math.max(width, height) * 0.65
        );
        crimsonGlow.addColorStop(0, "rgba(196, 22, 28, 0.18)");
        crimsonGlow.addColorStop(0.6, "rgba(196, 22, 28, 0.06)");
        crimsonGlow.addColorStop(1, "rgba(196, 22, 28, 0)");
        context.fillStyle = crimsonGlow;
        context.fillRect(0, 0, width, height);
      }

      const gridSize = 52;
      const offset = (time * 0.02) % gridSize;
      context.lineWidth = 1;
      context.strokeStyle = hasBackgroundImage
        ? "rgba(254, 106, 111, 0.13)"
        : "rgba(254, 106, 111, 0.08)";
      context.beginPath();

      for (let x = -gridSize + offset; x < width + gridSize; x += gridSize) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      for (let y = -gridSize + offset; y < height + gridSize; y += gridSize) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      context.stroke();
    }

    function drawTrail(now: number) {
      const minTime = now - trailDurationMs;
      points = points.filter((point) => point.time >= minTime);
      if (points.length < 2) return;

      context.lineCap = "round";
      context.lineJoin = "round";

      for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1];
        const current = points[i];
        const age = Math.min(1, (now - current.time) / trailDurationMs);
        const life = 1 - age;
        if (life <= 0) continue;

        const mix = i / points.length;
        const red = Math.round(196 + mix * 58);
        const green = Math.round(22 + mix * 54);
        const blue = Math.round(28 + mix * 42);
        context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${0.08 + life * 0.62})`;
        context.shadowBlur = 6 + life * 22;
        context.shadowColor = `rgba(248, 46, 53, ${0.18 + life * 0.5})`;
        context.lineWidth = 1.8 + life * 2.8;

        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(current.x, current.y);
        context.stroke();
      }

      context.shadowBlur = 0;
      for (let i = 0; i < points.length; i += 4) {
        const point = points[i];
        const age = Math.min(1, (now - point.time) / trailDurationMs);
        const life = 1 - age;
        if (life <= 0) continue;

        context.fillStyle = `rgba(254, 200, 202, ${0.16 + life * 0.5})`;
        context.beginPath();
        context.arc(point.x, point.y, 1 + life * 1.8, 0, Math.PI * 2);
        context.fill();
      }
    }

    function drawSparks(now: number) {
      if (!sparks.length) return;

      sparks = sparks.filter((spark) => now - spark.bornAt < spark.lifeMs);
      if (!sparks.length) return;

      context.lineCap = "round";
      for (const spark of sparks) {
        const age = Math.min(1, (now - spark.bornAt) / spark.lifeMs);
        const life = 1 - age;
        if (life <= 0) continue;

        const x = spark.x + spark.vx * (now - spark.bornAt);
        const y = spark.y + spark.vy * (now - spark.bornAt);
        const tailX = x - spark.vx * 20;
        const tailY = y - spark.vy * 20;

        context.strokeStyle = `rgba(254, 166, 170, ${life * 0.66})`;
        context.lineWidth = 0.9 + life * 1.2;
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(x, y);
        context.stroke();
      }
    }

    function drawCursor(time: number) {
      if (!pointer.active || prefersReducedMotion) return;
      const pulse = 0.7 + Math.sin(time * 0.01) * 0.3;
      context.strokeStyle = `rgba(254, 186, 188, ${0.2 + pulse * 0.35})`;
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(pointer.x, pointer.y, 12 + pulse * 4, 0, Math.PI * 2);
      context.stroke();
    }

    function drawFrame(now: number) {
      drawBase(now);
      drawTrail(now);
      drawSparks(now);
      drawCursor(now);
      rafId = window.requestAnimationFrame(drawFrame);
    }

    resize();
    rafId = window.requestAnimationFrame(drawFrame);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchstart", onTouchMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseout", onPointerLeave, { passive: true });
    window.addEventListener("touchend", onPointerLeave, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouchMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseout", onPointerLeave);
      window.removeEventListener("touchend", onPointerLeave);
    };
  }, [hasBackgroundImage, trailDurationMs]);

  return (
    <div className={`${styles.wrapper} ${className ?? ""}`.trim()} aria-hidden="true">
      {hasBackgroundImage ? (
        <div
          className={styles.imageLayer}
          style={{
            backgroundImage: `url("${backgroundImageSrc}")`,
            opacity: safeImageOpacity,
            backgroundPosition: backgroundImagePosition,
          }}
        />
      ) : null}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
