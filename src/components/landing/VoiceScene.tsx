"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SceneCanvas = dynamic(() => import("./VoiceSceneCanvas"), {
  ssr: false,
  loading: () => <StaticVoiceOrb />,
});

function StaticVoiceOrb() {
  return (
    <div className="static-voice-orb" aria-hidden="true">
      <span className="static-voice-orb__ring" />
      <span className="static-voice-orb__core">
        {[0.4, 0.72, 1, 0.72, 0.4].map((height, index) => (
          <i key={`${height}-${index}`} style={{ height: `${height * 46}px` }} />
        ))}
      </span>
    </div>
  );
}

export function VoiceScene() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [hasCheckedMotion, setHasCheckedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
      setHasCheckedMotion(true);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return (
    <div
      className="hero-visual"
      role="img"
      aria-label="Rappresentazione tridimensionale di un agente vocale Voicyy"
    >
      <div className="hero-visual__grid" aria-hidden="true" />
      {hasCheckedMotion && !prefersReducedMotion ? <SceneCanvas /> : <StaticVoiceOrb />}
      <div className="hero-status" aria-hidden="true">
        <span className="hero-status__dot" />
        Agent online
      </div>
    </div>
  );
}
