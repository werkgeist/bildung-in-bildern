"use client";

import Link from "next/link";
import { useEffect, useId, useReducer, type KeyboardEvent } from "react";
import { initialBasin, stepWater, transition, type Basin } from "@/lib/experiments/washbasin-model";
import styles from "./WashbasinExperiment.module.css";

// Native buttons retain Enter/Space activation; suppress only held-key repeats.
function ignoreRepeat(event: KeyboardEvent<HTMLButtonElement>) {
  if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault();
}

function BasinScene({ basin }: { basin: Basin }) {
  const id = useId();
  const level = 348 - basin.volume * 143;
  const flow = stepWater(basin, 0.1);
  const moving = basin.phase === "running" && !basin.reduced;
  const overflowing = moving ? flow.overflow > 0 : basin.reduced && (basin.lastManualFlow?.overflow ?? 0) > 0;
  const draining = moving ? flow.drain > 0 : basin.reduced && (basin.lastManualFlow?.drain ?? 0) > 0;
  return (
    <svg className={styles.scene} viewBox="0 0 840 440" role="img" aria-labelledby={`${id}-title ${id}-description`}
      data-testid="basin-scene" data-volume={basin.volume}>
      <title id={`${id}-title`}>Blick ins Becken</title>
      <desc id={`${id}-description`}>
        {basin.volume === 0 ? "Das Becken ist leer." : `Das Becken ist zu ${Math.round(basin.volume * 100)} Prozent gefüllt.`}
        {basin.tapOpen ? " Hahn offen." : " Hahn zu."}
        {basin.plugged ? " Stöpsel eingesetzt." : " Stöpsel herausgenommen."}
        {overflowing ? basin.reduced ? " Beim letzten Schritt ist Wasser durch den seitlichen Überlauf abgelaufen." : " Wasser fließt durch den seitlichen Überlauf in den Ablauf." : ""}
      </desc>
      <defs>
        <linearGradient id={`${id}-ceramic`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fdfcf8" /><stop offset="1" stopColor="#d9ded8" />
        </linearGradient>
        <linearGradient id={`${id}-metal`}><stop stopColor="#8b9c97" /><stop offset=".4" stopColor="#edf1e9" /><stop offset=".7" stopColor="#c2ccc5" /><stop offset="1" stopColor="#7f918b" /></linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#70c7c3" /><stop offset="1" stopColor="#288b8b" /></linearGradient>
        <clipPath id={`${id}-inside`}><path d="M161 180 H679 L651 311 Q642 348 600 348 H240 Q199 348 189 311 Z" /></clipPath>
      </defs>
      {/* Warm wall and counter, deliberately no moving decorative elements. */}
      <path d="M116 88 H724 M116 145 H724" stroke="#e8e9df" strokeWidth="1" />
      <ellipse cx="420" cy="403" rx="258" ry="16" fill="#dde1d7" opacity=".55" />
      <path d="M658 205 H716 V394 Q716 408 701 408 H435 Q420 408 420 421 V438" fill="none" stroke="#bec9c0" strokeWidth="22" strokeLinejoin="round" />
      <path d="M420 353 V438" stroke="#bec9c0" strokeWidth="27" />
      <path d="M420 353 V438" stroke="#eef0e8" strokeWidth="16" />
      <path d="M658 205 H716 V394 Q716 408 701 408 H435 Q420 408 420 421 V438" fill="none" stroke="#eef0e8" strokeWidth="13" strokeLinejoin="round" />
      {overflowing && <path data-testid="overflow-route" d="M658 205 H716 V394 Q716 408 701 408 H435 Q420 408 420 421 V438" fill="none" stroke="#328f91" strokeWidth="7" strokeLinejoin="round" />}
      {(draining || overflowing) && <path d={`M420 ${draining ? 353 : 408} V438`} stroke="#328f91" strokeWidth="9" />}
      <rect x="108" y="166" width="624" height="17" rx="8" fill="#cbd2c6" />
      <rect x="108" y="161" width="624" height="13" rx="6" fill="#f9f8f0" stroke="#a2afa4" strokeWidth="2" />
      {/* Ceramic cutaway. */}
      <path d="M140 180 H700 L670 315 Q660 370 600 370 H240 Q180 370 170 315 Z" fill={`url(#${id}-ceramic)`} stroke="#869b90" strokeWidth="2.5" />
      <path d="M161 180 H679 L651 311 Q642 348 600 348 H240 Q199 348 189 311 Z" fill="#f3f4ed" stroke="#adbdb3" strokeWidth="2" />
      <g clipPath={`url(#${id}-inside)`}>
        {basin.volume > 0 && <>
          <rect x="155" y={level} width="530" height={350 - level} fill={`url(#${id}-water)`} opacity=".88" />
          <path d={`M155 ${level} H685`} stroke="#167c7e" strokeWidth="3" />
          <path d={`M155 ${level + 4} H685`} stroke="#c8eeea" strokeWidth="2" opacity=".65" />
        </>}
      </g>
      <rect x="646" y="197" width="22" height="13" rx="6" fill="#536f65" stroke="#f7f7ee" strokeWidth="3" />
      <path d="M405 348 H435" stroke="#586e65" strokeWidth="9" strokeLinecap="round" />
      {basin.plugged ? <g>
        <path d="M400 345 Q420 336 440 345 L437 352 H403 Z" fill="#4c635c" stroke="#304c44" strokeWidth="2" />
        <path d="M414 341 V335 Q420 330 426 335 V341" fill="none" stroke="#879b90" strokeWidth="3" />
      </g> : <g>
        <path d="M421 335 Q462 312 490 259 T551 148" fill="none" stroke="#9cae9e" strokeWidth="2" strokeDasharray="3 5" />
        <path d="M529 142 Q549 133 569 142 L566 153 H532 Z" fill="#4c635c" stroke="#304c44" strokeWidth="2" />
        <path d="M543 138 V130 Q549 125 555 130 V138" fill="none" stroke="#879b90" strokeWidth="3" />
      </g>}
      {/* Faucet: broad metal silhouette and a tangible lever. */}
      <rect x="232" y="151" width="63" height="12" rx="6" fill="#8d9f94" />
      <path d="M251 151 V88 Q251 61 280 61 H314 Q345 61 345 91 V120" fill="none" stroke="#71897d" strokeWidth="28" strokeLinejoin="round" />
      <path d="M251 151 V88 Q251 61 280 61 H314 Q345 61 345 91 V120" fill="none" stroke={`url(#${id}-metal)`} strokeWidth="23" strokeLinejoin="round" />
      <rect x="330" y="114" width="30" height="12" rx="3" fill="#6a8276" />
      <path d={basin.tapOpen ? "M251 92 L218 69" : "M251 92 H210"} stroke="#607b6d" strokeWidth="13" strokeLinecap="round" />
      <path d={basin.tapOpen ? "M251 89 L218 66" : "M251 89 H210"} stroke="#c7d2c7" strokeWidth="7" strokeLinecap="round" />
      {moving && flow.inflow > 0 && <g data-testid="tap-stream">
        <path d={`M345 127 V${level}`} stroke="#58b6b7" strokeWidth="13" opacity=".85" />
        <path d={`M342 127 V${level}`} stroke="#b8e7e1" strokeWidth="3" opacity=".9" />
      </g>}
    </svg>
  );
}

export default function WashbasinExperiment() {
  const [basin, dispatch] = useReducer(transition, undefined, initialBasin);
  const flow = stepWater(basin, 0.1);
  const waterChanges = flow.volume !== basin.volume;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => dispatch({ type: "motion", reduced: media.matches });
    update();
    media.addEventListener("change", update);
    const pause = () => dispatch({ type: "pause" });
    const visibility = () => { if (document.hidden) pause(); };
    const restore = (event: PageTransitionEvent) => { if (event.persisted) pause(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pause);
    window.addEventListener("pageshow", restore);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pause);
      window.removeEventListener("pageshow", restore);
    };
  }, []);

  useEffect(() => {
    // Full/empty/held levels need no rendering clock. The phase remains running,
    // and either control can restart model time immediately.
    if (basin.phase !== "running" || basin.reduced || !waterChanges) return;
    let request = 0;
    let previous: number | undefined;
    const frame = (now: number) => {
      // A hidden page or a suspended main thread must never accumulate water.
      if (document.hidden) { dispatch({ type: "pause" }); return; }
      if (previous !== undefined) {
        const seconds = (now - previous) / 1000;
        if (seconds > 0.25) { dispatch({ type: "pause" }); return; }
        dispatch({ type: "tick", seconds });
      }
      previous = now;
      request = requestAnimationFrame(frame);
    };
    request = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(request);
  }, [basin.phase, basin.reduced, waterChanges]);

  const moving = basin.phase === "running" && !basin.reduced;
  const overflow = moving && flow.overflow > 0;
  const manualOverflow = basin.reduced && (basin.lastManualFlow?.overflow ?? 0) > 0;
  let status = "Der Wasserstand bleibt gleich";
  if (basin.phase === "paused" && !basin.reduced) status = "Versuch pausiert";
  else if (basin.volume === 0 && (!moving || flow.volume === 0)) status = "Das Becken ist leer";
  else if (moving && flow.volume - basin.volume > 0.00001) status = "Das Wasser steigt";
  else if (moving && basin.volume - flow.volume > 0.00001) status = "Das Wasser sinkt";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.back} href="/">← Zur Auswahl</Link>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>Ausprobieren</p>
          <h1>Das Waschbecken</h1>
          <p>Du kannst den Hahn öffnen und den Stöpsel herausnehmen.</p>
        </header>
        <section className={styles.experiment} aria-label="Waschbecken ausprobieren">
          <div className={styles.sceneHeader}>
            <span>Blick ins Becken</span>
            <span className={styles.mode}>{basin.reduced ? "In einzelnen Schritten" : basin.phase === "ready" ? "Bereit" : basin.phase === "paused" ? "Pausiert" : "Läuft"}</span>
          </div>
          <BasinScene basin={basin} />
          <div className={styles.observation}>
            <p role="status" aria-live="polite" aria-atomic="true"><span className={styles.statusDot} aria-hidden="true" />{status}</p>
            <p className={styles.explanation}>{overflow ? "Das Wasser läuft durch diese Öffnung ab." : manualOverflow ? "Wasser ist durch diese Öffnung abgelaufen." : basin.reduced ? "Das Wasser verändert sich mit diesem Knopf." : basin.phase === "paused" ? "Du kannst die Einstellungen ändern. Weiter lässt das Wasser laufen." : "\u00a0"}</p>
          </div>
          <div className={styles.controls}>
            <div className={styles.control}>
              <p><span aria-hidden="true" className={styles.controlIcon}>↳</span>Hahn <span>{basin.tapOpen ? "ist offen" : "ist zu"}</span></p>
              <button type="button" className={styles.primary} onKeyDown={ignoreRepeat} onClick={() => dispatch({ type: "tap" })}>{basin.tapOpen ? "Hahn schließen" : "Hahn öffnen"}<span aria-hidden="true">{basin.tapOpen ? "−" : "+"}</span></button>
            </div>
            <div className={styles.control}>
              <p><span aria-hidden="true" className={styles.controlIcon}>⊙</span>Stöpsel <span>{basin.plugged ? "ist drin" : "ist draußen"}</span></p>
              <button type="button" className={styles.secondary} onKeyDown={ignoreRepeat} onClick={() => dispatch({ type: "plug" })}>{basin.plugged ? "Stöpsel herausnehmen" : "Stöpsel einsetzen"}<span aria-hidden="true">{basin.plugged ? "↑" : "↓"}</span></button>
            </div>
          </div>
        </section>
        <div className={styles.utilities}>
          {basin.reduced ? <button type="button" className={styles.manual} onKeyDown={ignoreRepeat} onClick={() => dispatch({ type: "manual" })}>Wasser weiterlaufen lassen</button>
            : <button type="button" className={styles.pause} onKeyDown={ignoreRepeat} disabled={basin.phase === "ready"} onClick={() => dispatch({ type: basin.phase === "paused" ? "resume" : "pause" })}><span aria-hidden="true">{basin.phase === "paused" ? "▷" : "Ⅱ"}</span>{basin.phase === "paused" ? "Weiter" : "Pause"}</button>}
          <button type="button" className={styles.reset} onKeyDown={ignoreRepeat} onClick={() => dispatch({ type: "reset" })}>Neu anfangen</button>
        </div>
      </div>
    </main>
  );
}
