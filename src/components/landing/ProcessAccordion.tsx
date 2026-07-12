"use client";

import { ArrowRight, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ProcessItem = {
  step: string;
  title: string;
  description: string;
  detail: string;
  highlights: readonly string[];
};

type ProcessAccordionProps = {
  items: readonly ProcessItem[];
};

export function ProcessAccordion({ items }: ProcessAccordionProps) {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasItems = items.length > 0;
  const clampedActiveIndex = hasItems
    ? Math.min(items.length - 1, Math.max(0, activeIndex))
    : 0;

  const observerOptions = useMemo(
    () => ({
      root: null as Element | Document | null,
      rootMargin: "-30% 0px -55% 0px",
      threshold: [0, 0.2, 0.35, 0.5],
    }),
    [],
  );

  useEffect(() => {
    if (!hasItems) return;

    const elements = itemRefs.current.filter(Boolean) as HTMLLIElement[];
    if (!elements.length) return;

    let raf = 0;
    const observer = new IntersectionObserver((entries) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;

        const index = elements.indexOf(best.target as HTMLLIElement);
        if (index >= 0) setActiveIndex(index);
      });
    }, observerOptions);

    elements.forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [hasItems, observerOptions]);

  return (
    <ol className="process-list">
      {items.map((item, index) => (
        <li
          key={item.step}
          className="process-item"
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
        >
          <details
            className="process-disclosure"
            name="voicyy-process"
            open={index === clampedActiveIndex}
            onToggle={(event) => {
              const nextOpen = event.currentTarget.open;
              if (nextOpen) {
                setActiveIndex(index);
                return;
              }

              if (index === clampedActiveIndex) {
                setActiveIndex(index);
              }
            }}
          >
            <summary>
              <span className="process-item__step" aria-hidden="true">
                {item.step}
              </span>
              <span className="process-item__summary">
                <strong role="heading" aria-level={3}>{item.title}</strong>
                <span>{item.description}</span>
              </span>
              <span className="process-item__action" aria-hidden="true">
                <span className="process-item__action-label">Più info</span>
                <ArrowRight className="process-item__arrow" />
              </span>
            </summary>
            <div className="process-item__details">
              <p>{item.detail}</p>
              <ul aria-label={`Punti chiave: ${item.title}`}>
                {item.highlights.map((highlight) => (
                  <li key={highlight}>
                    <Check aria-hidden="true" size={14} />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
