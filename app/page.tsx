"use client";

import { useEffect, useState } from "react";
import CalendarApp from "@/components/CalendarApp";

export default function Page() {
  const [phase, setPhase] = useState<"hidden" | "bar" | "reveal">("hidden");

  useEffect(() => {
    // tiny delay so the first paint is clean before animation fires
    const t1 = setTimeout(() => setPhase("bar"), 60);
    const t2 = setTimeout(() => setPhase("reveal"), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <style>{`
        /* ── loader bar ─────────────────────────────────────────── */
        @keyframes barSlide {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        /* ── main content reveal ────────────────────────────────── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        /* ── subtle shimmer sweep across the surface on entry ───── */
        @keyframes shimmer {
          0%   { opacity: 0; transform: translateX(-100%) skewX(-12deg); }
          40%  { opacity: .35; }
          100% { opacity: 0; transform: translateX(220%)  skewX(-12deg); }
        }

        .schedule-loader {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #f5f4f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          pointer-events: none;
          transition: opacity 0.45s ease 0.15s, visibility 0s linear 0.6s;
        }
        .schedule-loader.gone {
          opacity: 0;
          visibility: hidden;
        }

        .loader-wordmark {
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: #c0bdb7;
        }

        .loader-track {
          width: 160px;
          height: 1px;
          background: #e8e6e0;
          border-radius: 1px;
          overflow: hidden;
        }
        .loader-track-fill {
          height: 100%;
          width: 100%;
          background: #1a1a1a;
          transform: scaleX(0);
          transform-origin: left;
          border-radius: 1px;
        }
        .loader-track-fill.running {
          animation: barSlide 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* ── calendar wrapper ───────────────────────────────────── */
        .cal-wrapper {
          opacity: 0;
          transform: translateY(18px);
          transition: none;
        }
        .cal-wrapper.visible {
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* ── shimmer overlay that sweeps once ───────────────────── */
        .cal-shimmer {
          position: fixed;
          inset: 0;
          z-index: 40;
          pointer-events: none;
          overflow: hidden;
        }
        .cal-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 60%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.55) 50%,
            transparent 100%
          );
          animation: shimmer 0.9s cubic-bezier(0.4, 0, 0.6, 1) 0.6s both;
        }
      `}</style>

      {/* ── Loader overlay ─────────────────────────────────────────── */}
      <div className={`schedule-loader${phase === "reveal" ? " gone" : ""}`}>
        <div className="loader-wordmark">SCHEDULE</div>
        <div className="loader-track">
          <div className={`loader-track-fill${phase !== "hidden" ? " running" : ""}`} />
        </div>
      </div>

      {/* ── Shimmer sweep (plays once after reveal) ─────────────────── */}
      {phase === "reveal" && <div className="cal-shimmer" />}

      {/* ── Calendar ────────────────────────────────────────────────── */}
      <div className={`cal-wrapper${phase === "reveal" ? " visible" : ""}`}>
        <CalendarApp />
      </div>
    </>
  );
}