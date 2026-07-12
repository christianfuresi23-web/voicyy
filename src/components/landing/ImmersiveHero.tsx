"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type ImmersiveHeroProps = {
  copy: ReactNode;
  scene: ReactNode;
};

const MOSAIC_CELLS = Array.from({ length: 72 }, (_, index) => ({
  id: `mosaic-${index}`,
  accent: [8, 17, 23, 30, 43, 52, 58, 69].includes(index),
  muted: (index * 7) % 11 < 3,
  row: Math.floor(index / 12),
  column: index % 12,
}));

export function ImmersiveHero({ copy, scene }: ImmersiveHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const scrollProgress = useMotionValue(0);
  const progress = useSpring(scrollProgress, {
    stiffness: 95,
    damping: 26,
    mass: 0.35,
  });

  useEffect(() => {
    if (shouldReduceMotion) return;

    let animationFrame = 0;
    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;

      const bounds = section.getBoundingClientRect();
      const scrollableDistance = Math.max(
        1,
        bounds.height - window.innerHeight,
      );
      const nextProgress = Math.min(1, Math.max(0, -bounds.top / scrollableDistance));
      scrollProgress.set(nextProgress);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [scrollProgress, shouldReduceMotion]);

  const frameScale = useTransform(
    progress,
    [0, 0.18, 0.56, 0.82, 1],
    [0.84, 0.89, 1, 1.018, 1.028],
  );
  const frameRadius = useTransform(progress, [0, 0.42, 0.62], [54, 32, 0]);
  const frameY = useTransform(progress, [0, 0.56, 1], [46, 0, -8]);
  const frameRotateX = useTransform(progress, [0, 0.5], [4.5, 0]);
  const contentOpacity = useTransform(
    progress,
    [0, 0.62, 0.82, 1],
    [1, 1, 0.34, 0],
  );
  const copyY = useTransform(progress, [0, 0.62, 1], [12, -18, -72]);
  const copyX = useTransform(progress, [0, 0.5], [-18, 0]);
  const sceneScale = useTransform(
    progress,
    [0, 0.6, 0.86, 1],
    [0.9, 1.035, 1.13, 1.18],
  );
  const sceneY = useTransform(progress, [0, 0.62, 1], [28, -12, -54]);
  const sceneRotateY = useTransform(progress, [0, 0.55], [-4, 0]);
  const glowOpacity = useTransform(
    progress,
    [0, 0.5, 0.78, 1],
    [0.14, 0.7, 0.88, 0],
  );
  const cueOpacity = useTransform(progress, [0, 0.2], [1, 0]);
  const mosaicOpacity = useTransform(
    progress,
    [0, 0.61, 0.73, 1],
    [0, 0, 0.9, 1],
  );
  const mosaicY = useTransform(progress, [0.62, 0.82, 1], ["24%", "0%", "-4%"]);
  const mosaicScale = useTransform(progress, [0.62, 0.86, 1], [1.16, 1, 1.025]);
  const mosaicWashOpacity = useTransform(progress, [0.7, 0.9, 1], [0, 0.36, 0.94]);
  const transitionLabelOpacity = useTransform(
    progress,
    [0.78, 0.9, 0.98, 1],
    [0, 0, 1, 0.72],
  );

  const reducedClassName = shouldReduceMotion
    ? " hero-scroll-stage--reduced"
    : "";

  return (
    <section
      ref={sectionRef}
      className={`hero-scroll-stage${reducedClassName}`}
      aria-labelledby="hero-title"
    >
      <motion.div
        className="hero-section hero-section--immersive"
        style={
          shouldReduceMotion
            ? undefined
            : {
                scale: frameScale,
                borderRadius: frameRadius,
                y: frameY,
                rotateX: frameRotateX,
                transformPerspective: 1500,
              }
        }
      >
        <motion.div
          className="hero-atmosphere"
          aria-hidden="true"
          style={shouldReduceMotion ? undefined : { opacity: glowOpacity }}
        />

        <div className="site-shell hero-layout">
          <motion.div
            className="hero-motion-copy"
            style={
              shouldReduceMotion
                ? undefined
                : { x: copyX, y: copyY, opacity: contentOpacity }
            }
          >
            {copy}
          </motion.div>
          <motion.div
            className="hero-motion-scene"
            style={
              shouldReduceMotion
                ? undefined
                : {
                    scale: sceneScale,
                    y: sceneY,
                    rotateY: sceneRotateY,
                    opacity: contentOpacity,
                    transformPerspective: 1200,
                  }
            }
          >
            {scene}
          </motion.div>
        </div>

        {!shouldReduceMotion && (
          <motion.div
            className="hero-mosaic"
            aria-hidden="true"
            style={{ opacity: mosaicOpacity, y: mosaicY, scale: mosaicScale }}
          >
            <div className="hero-mosaic__grid">
              {MOSAIC_CELLS.map((cell) => (
                <span
                  key={cell.id}
                  className={`hero-mosaic__pixel${
                    cell.accent ? " hero-mosaic__pixel--accent" : ""
                  }${cell.muted ? " hero-mosaic__pixel--muted" : ""}`}
                  style={
                    {
                      "--pixel-row": cell.row,
                      "--pixel-column": cell.column,
                      "--pixel-lift": `${
                        (5 - cell.row) * 12 + ((cell.column % 3) - 1) * 5
                      }px`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <motion.div
              className="hero-mosaic__wash"
              style={{ opacity: mosaicWashOpacity }}
            />
            <motion.div
              className="hero-mosaic__label"
              style={{ opacity: transitionLabelOpacity }}
            >
              <span aria-hidden="true" />
              Dalla voce all&apos;azione
            </motion.div>
          </motion.div>
        )}

        <motion.a
          href="#vantaggi"
          className="scroll-cue"
          aria-label="Scorri ai vantaggi"
          style={shouldReduceMotion ? undefined : { opacity: cueOpacity }}
        >
          <span>Scorri per entrare</span>
          <ArrowDown aria-hidden="true" size={16} />
        </motion.a>
      </motion.div>
    </section>
  );
}
