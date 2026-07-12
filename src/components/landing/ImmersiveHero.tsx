import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";

type ImmersiveHeroProps = {
  copy: ReactNode;
};

const WAVE_BARS = [18, 31, 47, 68, 47, 31, 18] as const;

export function ImmersiveHero({ copy }: ImmersiveHeroProps) {
  return (
    <section
      className="hero-section hero-section--stable"
      aria-labelledby="hero-title"
      data-journey-stop="hero"
    >
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="hero-grid-plane" aria-hidden="true" />

      <div className="site-shell hero-layout">
        <div className="hero-copy-frame">{copy}</div>

        <div className="hero-journey-preview" aria-hidden="true">
          <span className="hero-journey-preview__ring hero-journey-preview__ring--one" />
          <span className="hero-journey-preview__ring hero-journey-preview__ring--two" />
          <span className="hero-journey-preview__ring hero-journey-preview__ring--three" />

          <div className="hero-journey-preview__wave">
            {WAVE_BARS.map((height, index) => (
              <i key={`${height}-${index}`} style={{ height }} />
            ))}
          </div>

          <div className="hero-journey-card hero-journey-card--call">
            <span className="hero-journey-card__status" />
            <span>
              <small>Agent attivo</small>
              Chiamata gestita
            </span>
            <strong>00:42</strong>
          </div>

          <div className="hero-journey-card hero-journey-card--calendar">
            <span className="hero-journey-card__check">✓</span>
            <span>
              <small>Google Calendar</small>
              Prenotazione confermata
            </span>
          </div>
        </div>
      </div>

      <a href="#vantaggi" className="scroll-cue" aria-label="Scorri ai vantaggi">
        <span>Segui il percorso</span>
        <ArrowDown aria-hidden="true" size={16} />
      </a>
    </section>
  );
}
