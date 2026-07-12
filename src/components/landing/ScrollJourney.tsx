"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clampUnit,
  mix,
  sampleCurvedSegment,
  smoothStep,
  type JourneyPoint,
} from "./journey-path";

export type JourneyDirection = "down" | "up";

type ViewportPose = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

type JourneyAnchor = {
  id: string;
  label: string;
  desktop: ViewportPose;
  mobile: ViewportPose;
  downBend: number;
  upBend: number;
  downRotation: number;
  upRotation: number;
};

type MeasuredAnchor = {
  anchor: JourneyAnchor;
  position: number;
};

type ScrollJourneyProps = {
  children: ReactNode;
};

const JourneyDirectionContext = createContext<JourneyDirection>("down");

const JOURNEY_ANCHORS = [
  {
    id: "hero",
    label: "Agent online",
    desktop: { x: 0.76, y: 0.57, scale: 1.08, opacity: 1 },
    mobile: { x: 0.89, y: 0.72, scale: 0.78, opacity: 0.96 },
    downBend: 0.12,
    upBend: -0.18,
    downRotation: -3,
    upRotation: 5,
  },
  {
    id: "vantaggi",
    label: "Sempre presente",
    desktop: { x: 0.99, y: 0.31, scale: 0.78, opacity: 0.96 },
    mobile: { x: 0.92, y: 0.28, scale: 0.58, opacity: 0.78 },
    downBend: -0.14,
    upBend: 0.2,
    downRotation: 7,
    upRotation: -8,
  },
  {
    id: "processo",
    label: "Flusso su misura",
    desktop: { x: 0.01, y: 0.38, scale: 0.74, opacity: 0.94 },
    mobile: { x: 0.86, y: 0.38, scale: 0.54, opacity: 0.72 },
    downBend: 0.17,
    upBend: -0.23,
    downRotation: -8,
    upRotation: 9,
  },
  {
    id: "tono-umano",
    label: "Una voce naturale",
    desktop: { x: 0.99, y: 0.54, scale: 0.78, opacity: 0.94 },
    mobile: { x: 0.92, y: 0.58, scale: 0.58, opacity: 0.74 },
    downBend: -0.18,
    upBend: 0.24,
    downRotation: 8,
    upRotation: -7,
  },
  {
    id: "scenari",
    label: "Ogni attività",
    desktop: { x: 0.01, y: 0.34, scale: 0.7, opacity: 0.92 },
    mobile: { x: 0.86, y: 0.35, scale: 0.52, opacity: 0.7 },
    downBend: 0.16,
    upBend: -0.21,
    downRotation: -7,
    upRotation: 8,
  },
  {
    id: "configuratore",
    label: "Costruiamolo insieme",
    desktop: { x: 0.99, y: 0.24, scale: 0.7, opacity: 0.9 },
    mobile: { x: 0.92, y: 0.25, scale: 0.5, opacity: 0.66 },
    downBend: -0.1,
    upBend: 0.15,
    downRotation: 5,
    upRotation: -6,
  },
  {
    id: "contatto",
    label: "Parliamone",
    desktop: { x: 0.82, y: 0.42, scale: 0.83, opacity: 0.98 },
    mobile: { x: 0.88, y: 0.4, scale: 0.6, opacity: 0.82 },
    downBend: 0.12,
    upBend: -0.2,
    downRotation: -4,
    upRotation: 7,
  },
  {
    id: "footer",
    label: "",
    desktop: { x: 0.55, y: 0.18, scale: 0.62, opacity: 0 },
    mobile: { x: 0.9, y: 0.16, scale: 0.46, opacity: 0 },
    downBend: -0.08,
    upBend: 0.14,
    downRotation: 3,
    upRotation: -5,
  },
] as const satisfies readonly JourneyAnchor[];

export function useJourneyDirection() {
  return useContext(JourneyDirectionContext);
}

function viewportPoint(pose: ViewportPose, width: number, height: number): JourneyPoint {
  return {
    x: pose.x * width,
    y: pose.y * height,
  };
}

function formSafeOpacity(fromId: string, toId: string, progress: number) {
  if (fromId !== "configuratore" || toId !== "contatto") return 1;

  if (progress < 0.12) {
    return 1 - smoothStep(progress / 0.12);
  }

  if (progress > 0.82) {
    return smoothStep((progress - 0.82) / 0.18);
  }

  return 0;
}

export function ScrollJourney({ children }: ScrollJourneyProps) {
  const shouldReduceMotion = useReducedMotion();
  const [direction, setDirection] = useState<JourneyDirection>("down");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const directionRef = useRef<JourneyDirection>("down");

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);
  const opacity = useMotionValue(0);
  const routeTarget = useMotionValue(0);
  const routeBlend = useSpring(routeTarget, {
    stiffness: 390,
    damping: 42,
    mass: 0.55,
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      opacity.set(0);
      return;
    }

    let animationFrame = 0;
    let isActive = true;
    let measuredAnchors: MeasuredAnchor[] = [];
    let lastScrollY = window.scrollY;
    let accumulatedDelta = 0;
    let deltaSign = 0;

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateFrame);
    };

    const measureAnchors = () => {
      const viewportHeight = window.innerHeight;
      measuredAnchors = JOURNEY_ANCHORS.flatMap((anchor) => {
        const marker = document.querySelector<HTMLElement>(
          `[data-journey-stop="${anchor.id}"]`,
        );
        if (!marker) return [];

        const bounds = marker.getBoundingClientRect();
        return [
          {
            anchor,
            position:
              bounds.top +
              window.scrollY +
              Math.min(bounds.height * 0.5, viewportHeight * 0.5),
          },
        ];
      });
      scheduleUpdate();
    };

    const updateDirection = (nextScrollY: number) => {
      const delta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      if (Math.abs(delta) < 0.5) return;

      const nextSign = Math.sign(delta);
      if (nextSign !== deltaSign) {
        deltaSign = nextSign;
        accumulatedDelta = delta;
      } else {
        accumulatedDelta += delta;
      }

      if (Math.abs(accumulatedDelta) < 12) return;

      const nextDirection: JourneyDirection = accumulatedDelta > 0 ? "down" : "up";
      accumulatedDelta = 0;
      if (nextDirection === directionRef.current) return;

      directionRef.current = nextDirection;
      routeTarget.set(nextDirection === "up" ? 1 : 0);
      setDirection(nextDirection);
    };

    function updateFrame() {
      animationFrame = 0;
      if (!measuredAnchors.length) {
        opacity.set(0);
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth <= 900;
      const triggerPosition = window.scrollY + viewportHeight * 0.5;

      let fromIndex = 0;
      while (
        fromIndex < measuredAnchors.length - 1 &&
        triggerPosition >= measuredAnchors[fromIndex + 1].position
      ) {
        fromIndex += 1;
      }

      const toIndex = Math.min(fromIndex + 1, measuredAnchors.length - 1);
      const from = measuredAnchors[fromIndex];
      const to = measuredAnchors[toIndex];
      const distance = Math.max(1, to.position - from.position);
      const rawProgress = toIndex === fromIndex
        ? 0
        : clampUnit((triggerPosition - from.position) / distance);
      const progress = smoothStep(rawProgress);
      const fromPose = isMobile ? from.anchor.mobile : from.anchor.desktop;
      const toPose = isMobile ? to.anchor.mobile : to.anchor.desktop;
      const fromPoint = viewportPoint(fromPose, viewportWidth, viewportHeight);
      const toPoint = viewportPoint(toPose, viewportWidth, viewportHeight);
      const bendScale = Math.min(viewportWidth, viewportHeight) * (isMobile ? 0.42 : 1);

      const downPoint = sampleCurvedSegment(
        fromPoint,
        toPoint,
        progress,
        from.anchor.downBend * bendScale,
      );
      const upPoint = sampleCurvedSegment(
        fromPoint,
        toPoint,
        progress,
        from.anchor.upBend * bendScale,
      );
      const blend = routeBlend.get();

      x.set(mix(downPoint.x, upPoint.x, blend));
      y.set(mix(downPoint.y, upPoint.y, blend));
      scale.set(mix(fromPose.scale, toPose.scale, progress));
      rotate.set(
        mix(
          mix(from.anchor.downRotation, to.anchor.downRotation, progress),
          mix(from.anchor.upRotation, to.anchor.upRotation, progress),
          blend,
        ),
      );
      opacity.set(
        mix(fromPose.opacity, toPose.opacity, progress) *
          formSafeOpacity(from.anchor.id, to.anchor.id, rawProgress),
      );

      const nextActiveIndex = progress > 0.52 ? toIndex : fromIndex;
      if (nextActiveIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextActiveIndex;
        setActiveIndex(nextActiveIndex);
      }
    }

    const handleScroll = () => {
      updateDirection(window.scrollY);
      scheduleUpdate();
    };
    const handleResize = () => measureAnchors();
    const unsubscribeRouteBlend = routeBlend.on("change", scheduleUpdate);
    const resizeObserver = new ResizeObserver(measureAnchors);

    resizeObserver.observe(document.documentElement);
    JOURNEY_ANCHORS.forEach((anchor) => {
      const marker = document.querySelector<HTMLElement>(
        `[data-journey-stop="${anchor.id}"]`,
      );
      if (marker) resizeObserver.observe(marker);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    document.fonts.ready.then(() => {
      if (isActive) measureAnchors();
    });

    measureAnchors();

    return () => {
      isActive = false;
      window.cancelAnimationFrame(animationFrame);
      unsubscribeRouteBlend();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [opacity, rotate, routeBlend, routeTarget, scale, shouldReduceMotion, x, y]);

  const activeAnchor = JOURNEY_ANCHORS[activeIndex] ?? JOURNEY_ANCHORS[0];

  return (
    <JourneyDirectionContext.Provider value={direction}>
      {children}
      <motion.div
        className="journey-mascot"
        data-direction={direction}
        data-stop={activeAnchor.id}
        style={{ x, y, scale, rotate, opacity }}
        aria-hidden="true"
      >
        <div className="journey-mascot__anchor">
          <span className="journey-mascot__trail" />
          <span className="journey-mascot__signal">{activeAnchor.label}</span>
          <div className="journey-mascot__art">
            <Image
              className="journey-mascot__image journey-mascot__image--down"
              src="/voicyy-mascot.webp"
              alt=""
              width={1024}
              height={1536}
              sizes="(max-width: 900px) 150px, 250px"
              preload
            />
            <Image
              className="journey-mascot__image journey-mascot__image--up"
              src="/voicyy-mascot-up.webp"
              alt=""
              width={1024}
              height={1536}
              sizes="(max-width: 900px) 150px, 250px"
              loading="eager"
            />
          </div>
        </div>
      </motion.div>
    </JourneyDirectionContext.Provider>
  );
}
